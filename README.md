# intl-container

> A React component for loading i18n translations and intl locale data

## Example

```js
import React, { Component } from "react";
import Page from "./Page";
import createIntlContainer from "intl-container";

const IntlContainer = createIntlContainer({
  importIntl: () => import("intl"),
  importIntlLocale: locale => import("intl/locale-data/" + locale),
  importReactIntl: locale => import("react-intl/locale-data/" + locale),
  importCountryCodes: locale =>
    import("i18n-iso-countries/langs/" + locale + ".json"),
  importTranslation: locale => import("./i18n/" + locale)
});

export default class App extends Component {
  render() {
    return (
      <IntlContainer locale={this.props.locale}>
        <Page />
      </IntlContainer>
    );
  }
}
```

## Props

* **locale:** The locale to be loaded.
* **loader:** An element to use as loader. (Default: `<div/>`)
* **children:** Root component that needs to translate strings.
