# Particl Touchbar

Displays Particl & Bitcoin price on your Macbook's touchbar.

[Download Page](https://github.com/xludx/partbar/releases)


![alt text](https://raw.githubusercontent.com/xludx/partbar/master/doc/partbar.png)


## Prerequisites

* [MacBook Pro](http://www.apple.com/macbook-pro/) laptop with touch bar

## Custom Settings

Users have the option to define a custom configuration for this app.

Simply place a json file named `.partbar.json` in your home directory that has
the following structure.

```json
{
  "refresh": 300000,
  "coins": [
    "bitcoin",
    "particl"
  ],
  "currency": "$"
}
```

## Thanks

Particl Touchbar is based on [coinwatch](https://github.com/andrewrd/coinwatch/).
