# jQuery.SOAPUI: A SwaggerUI but for SOAP Services

## Description

This jQuery module spins up a web interface over the
[jquery.soap](https://github.com/doedje/jquery.soap) plugin in order to
try a SOAP Web Service directly from your web browser.  

This module has only one major pre-requisite: the SOAP service has to be exposed
through an API Gateway that supports CORS.
Hopefully, [apicast](https://github.com/3scale/apicast) does !

It is intended to be used in the 3scale developer portal.

## An history of SOAP Services Documentation  

Historically, SOAP Services were documented by a WSDL and their associated XSD.
However, the level of precision and usefulness allowed by the WSDL and XSD
annotations were mere.

That's why SOAP Services were usually accompanied by another documentation,
usually a PDF or Word document that describes fields semantic, business scenario
that could be implemented, error handling, implementation details. Some examples
are usually given.

Those documents are maybe the most useful, in order to understand and use
the SOAP Service.

## Why a "SOAPUI" ?

An implementation that only relies on WSDL and XSD to present a "Try it out"
feature is doomed to failure. The only example that this implementation
can propose is a sample SOAP message with question marks in each field to
fill-in.

```
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
				  xmlns:acme="http://www.acme.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <acme:doThisAndThat>
         <acme:foo>?</gs:foo>
         <acme:bar>?</gs:bar>
      </acme:doThisAndThat>
   </soapenv:Body>
</soapenv:Envelope>
```

But, do I need to fill in the `foo` field only ? or `bar` only ? or both ?
Which sample values could I use in order to do this and that ?

This project takes another approach that is based on examples. The idea is to
re-use the content of existing SOAP documentation (the meaty PDF or Word
documentation).

Most of this content can already be moved to an API Developer Portal, presented
as nice-to-read Web Pages.

This project provides a way to document the sample SOAP calls, with an
interactive interface where the developer can discover examples when reading
the documentation and can try it out directly from the documentation page.

Following this philosophy, the previous example would look like this:

_To do this, you have to pass the `foo` field with bla bla bla. Try it by yourself:_
```
<acme:doThisAndThat xmlns:acme="http://www.acme.com/">
   <acme:foo>123456</gs:foo>
</acme:doThisAndThat>
```

_To do this, you have to pass the `bar` field with bla bla bla. Try it by yourself:_
```
<acme:doThisAndThat xmlns:acme="http://www.acme.com/">
   <acme:bar>ABCDEF</gs:bar>
</acme:doThisAndThat>
```

The result is a business documentation with real world examples that can be tried
out by the developer.

## Installation in the 3scale Developer Portal

Load the following files in the 3scale Developer Portal, by creating new pages
with the following parameters:

| Title | Section | Path | Content-Type | Content |
| --- | --- | --- | --- | --- |
| soapui.js | &#124;--javascripts | `/javascripts/soapui.js` | `text/javascript` | [soapui.js](soapui.js) |
| jquery.soap.js | &#124;--javascripts | `/javascripts/jquery.soap.js` | `text/javascript` | [jquery.soap.js](jquery.soap/jquery.soap.js) |
| vkbeautify.js | &#124;--javascripts | `/javascripts/vkbeautify.js` | `text/javascript` | [vkbeautify.js](vkBeautify/vkbeautify.js) |
| soapui.css | &#124;--css | `/css/soapui.css` | `text/css` | [soapui.css](soapui.css) |

All those pages share the same common parameters:
 - Layout: *Leave empty*
 - Liquid enabled: unchecked
 - Handler: *Leave empty*

Then, create a new page to hold the documentation of your SOAP Service with the following parameters:
 - Section: `. Root`
 - Layout: `Main Layout`
 - Path: *something like `/docs/my_soap_service`*
 - Content Type: `text/html`
 - Liquid Enabled: unchecked
 - Handler: *Leave empty*

In the content, make sure to have at the top of your page:
```
<link rel="stylesheet" type="text/css" href="/css/soapui.css">
<script type='text/javascript' src='/javascripts/jquery.soap.js'></script>
<script type='text/javascript' src='/javascripts/vkbeautify.js'></script>
<script type='text/javascript' src='/javascripts/soapui.js'></script>
<script type='text/javascript'>
    $(document).ready(function() {
      $(".soapui").each(function (i, e) {
        $.soapui(e, {
          url: 'http://api.acme.test/ws',
          HTTPHeaders: { "user-key": "<your user-key here>" },
          enableLogging: true,
          appendMethodToURL: false
        });
      });
    });
</script>
```

And then write your documentation as usual:
```
<h2>Description of our SOAP service</h2>
blablabla
<h2>The getCountry method</h2>
Here is what does the getCountry method. Blablabla.
```

When you want to insert an example, write:
```
<div class="soapui">
<soap-action>http://acme.com/getCountry</soap-action>
<soap-body>
<!--
<gs:getCountryRequest xmlns:gs="http://spring.io/guides/gs-producing-web-service">
<gs:name>Spain</gs:name>
</gs:getCountryRequest>
-->
</soap-body>
</div>
```

Where the `soap-action` tag holds the value of the `soapAction` header and
`soap-body` holds the SOAP Body (so, without the SOAP envelope) as a comment block.

## Development

If you would like to give a try to this project without having a 3scale
API Management account or in order to develop more conveniently, you can
use the `index.html` test page.

First of all, clone this repository and the needed submodules:
```
git clone https://github.com/nmasse-itix/soapui.git
cd soapui
git submodule init
git submodule update
```

Then, modify the `index.html` page to point to your sample SOAP service.
You can also provide an API Key if you need one.
```
$.soapui(e, {
  url: 'http://api.acme.test/ws',
  HTTPHeaders: { "user-key": "<your user-key here>" },
  enableLogging: true,
  appendMethodToURL: false
});
```

And fire your favourite web server:
```
python -m SimpleHTTPServer
```

Target your web browser to http://localhost:8000/ and you are ready to go!

Note: the built-in examples use the [Spring Boot SOAP Example](https://github.com/spring-guides/gs-producing-web-service) service.
