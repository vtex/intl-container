const React = require('react')
const PropTypes = require('prop-types')
const { IntlProvider } = require('react-intl')
const reduce = require('lodash/reduce')
const keys = require('lodash/keys')
const assign = require('lodash/assign')
const { getISOAlpha3 } = require('./countryISO')

function createIntlContainer(params) {
  if (!params.importIntl) {
    throw new Error(
      'Please provide a "importIntl" function. Eg: () => import("intl")'
    )
  }
  if (!params.importIntlLocale) {
    throw new Error(
      'Please provide a "importIntlLocale" function. Eg: (locale) => import("intl/locale-data/jsonp/" + locale)'
    )
  }
  if (!params.importCountryCodes) {
    throw new Error(
      'Please provide a "importCountryCodes" function. Eg: (locale) => import("i18n-iso-countries/langs/" + locale ".json")'
    )
  }
  if (!params.importTranslation) {
    throw new Error(
      'Please provide a "importTranslation" function. Eg: (locale) => import("./i18n/" + locale).'
    )
  }

  const {
    importIntl,
    importIntlLocale,
    importCountryCodes,
    importTranslation,
  } = params

  const verbose = params.verbose != null ? params.verbose : true

  let currentLocale

  class IntlContainer extends React.Component {
    constructor(props) {
      super(props)

      this.state = {
        locale: null,
        messages: null,
      }

      this.handleLocaleChange = this.handleLocaleChange.bind(this)
      this.handleNewTranslations = this.handleNewTranslations.bind(this)
      this.importIntl = this.importIntl.bind(this)
      this.importReactIntl = this.importReactIntl.bind(this)
      this.importTranslation = this.importTranslation.bind(this)
      this.importCountryCodeTranslations = this.importCountryCodeTranslations.bind(
        this
      )
    }

    componentDidMount() {
      currentLocale = this.handleLocaleChange(this.props.locale)
    }

    componentWillReceiveProps(nextProps) {
      currentLocale = this.handleLocaleChange(nextProps.locale)
    }

    getBaseLocale(locale) {
      return locale.indexOf('-') !== -1 ? locale.split('-')[0] : locale
    }

    handleLocaleChange(locale) {
      const baseLocale = this.getBaseLocale(locale)
      const thisLocale = locale

      Promise.all([
        this.importIntl(baseLocale),
        this.importReactIntl(baseLocale),
        this.importTranslation(baseLocale, locale),
        this.importCountryCodeTranslations(baseLocale),
      ])
        .then(([intl, reactIntl, translations, countryCodeTranslations]) => {
          if (thisLocale === currentLocale) {
            this.handleNewTranslations(
              locale,
              Object.assign({}, translations, countryCodeTranslations)
            )
          }
        })
        .catch(error => {
          console.error(error)
          return Promise.reject(error)
        })

      return thisLocale
    }

    importIntl(baseLocale) {
      if (window && !window.Intl) {
        return Promise.all([
          importIntl(),
          importIntlLocale(baseLocale),
        ]).catch(e => {
          if (process.env.NODE_ENV === 'development' && verbose) {
            console.warn(
              `Error while loading Intl and Intl locale data for ${baseLocale}`,
              e
            )
          }
        })
      }
      return Promise.resolve()
    }

    importTranslation(baseLocale, locale) {
      return Promise.all([
        this.importSingleTranslation(baseLocale),
        this.importSingleTranslation(locale),
      ]).then(([baseTranslation, translation]) => {
        const mergedTranslation = assign({}, baseTranslation, translation)
        const emptyTranslation = keys(mergedTranslation).length === 0

        if (emptyTranslation && baseLocale !== 'en') {
          console.warn("Loading fallback locale 'en', and 'en-US'")
          return this.importTranslation('en', 'en-US')
        }

        return mergedTranslation
      })
    }

    importSingleTranslation(locale) {
      return importTranslation(locale).catch(e => {
        if (process.env.NODE_ENV === 'development' && verbose) {
          console.warn(`Error while loading translation for ${locale}`, e)
        }
        return {}
      })
    }

    importCountryCodeTranslations(baseLocale) {
      return importCountryCodes(baseLocale)
        .then(this.addCountryCodeNameSpace)
        .catch(() => {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `The library to get the translation of country names doesn't have translation for the language ${baseLocale}.`
            )
            console.warn(
              `Add to the translation file "${baseLocale}.json" the translation of the country names.`
            )
          }
        })
    }

    addCountryCodeNameSpace(obj) {
      return reduce(
        obj,
        (acc, value, key) => {
          acc[`country.${getISOAlpha3(key)}`] = value
          return acc
        },
        {}
      )
    }

    handleNewTranslations(locale, messages) {
      this.setState({
        locale,
        messages,
      })
    }

    render() {
      const { locale } = this.props
      const { messages } = this.state

      if (!messages || this.state.locale !== locale) {
        return null
      }

      return (
        <IntlProvider key={locale} locale={locale} messages={messages}>
          {this.props.children}
        </IntlProvider>
      )
    }
  }

  IntlContainer.propTypes = {
    locale: PropTypes.string.isRequired,
    children: PropTypes.element,
    loader: PropTypes.element.isRequired,
  }

  IntlContainer.defaultProps = {
    loader: <div />,
  }

  return IntlContainer
}

module.exports = createIntlContainer
