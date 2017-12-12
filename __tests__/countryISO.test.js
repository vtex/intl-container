const { getISOAlpha2, getISOAlpha3 } = require('../src/countryISO')

test('Should get the country code Alpha 2', () => {
  const countryCodeAlpha3 = 'BRA'

  const result = getISOAlpha2(countryCodeAlpha3)

  expect(result).toBe('BR')
})

test('Should get the country code Alpha 3', () => {
  const countryCodeAlpha2 = 'BR'

  const result = getISOAlpha3(countryCodeAlpha2)

  expect(result).toBe('BRA')
})
