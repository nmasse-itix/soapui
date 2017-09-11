/*
 * soapui.js - https://github.com/nmasse-itix/soapui
 * version: 0.1
 *
 * jQuery plugin to handle the "try it out" feature for SOAP Services
 *
 * License MIT
 * -----------------
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Nicolas MASSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Information
 * -----------
 *
 * For information about how to use soapui, authors, changelog, the latest version, etc...
 * Visit: https://github.com/nmasse-itix/soapui
 */

(function(factory) {
  if(typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('jquery'));
  } else if (jQuery) {
    factory(jQuery);
  } else {
    console.error('no jQuery found!')
  }
})(function($) {
  function threescale_authentication(select_node, soap_options) {
    $.ajax("/api_docs/account_data.json", {
      statusCode: {
        200: function (data, textStatus, xhr) {
          var user_keys = data.results.user_keys;
          for (var i = 0; i < user_keys.length; i++) {
            var name = user_keys[i].name;
            var value = user_keys[i].value;
            select_node.append($("<option>", { text: name, value: value }));
          }
        },
        401: function (xhr, textStatus, error) {
          // TODO Handle the error and display an error message
          console.log("ERROR: Could not fetch API Keys from the 3scale API.")
        }
      }
    });
    select_node.on('change', function (e) {
      if (e.target.value != null && e.target.value != "") {
        if (soap_options.HTTPHeaders == null) {
          soap_options.HTTPHeaders = {};
        }

        soap_options.HTTPHeaders["user-key"] = e.target.value;
      }
    });

  };
  function soapui(nodes, soap_options, custom_auth_schemes) {
    $(nodes).each(function (i, e) {
      var soap_options_copy = jQuery.extend({}, soap_options);
      init(e, soap_options_copy, custom_auth_schemes);
    });
  };
  function init(root_node, soap_options, custom_auth_schemes) {
    root_node = $(root_node); // Make sure it is a jQuery object

    // Detect if vkbeautify is loaded
    var vkbeautify = window.vkbeautify;
    if (vkbeautify == null) {
      console.log("vkbeautify not loaded, using a poor replacement for XML Pretty Printing");
      vkbeautify = { xml: function (xml) {
        // Poor man XML pretty printing
        return xml.replace(/(>)|([^>])(?=<)/g, "$1$2\n");
      } }
    }

    // SOAP request section
    var soapActionNode = $(root_node).find("soap-action").get(0);
    soapActionNode = soapActionNode != null ? $(soapActionNode) : null;
    var soapAction = soapActionNode != null ? soapActionNode.text() : null;
    if (soapAction != null && soapAction != "") {
      soapActionNode.before("<span>SOAP Action</span>");
      soapActionNode.replaceWith(function (i, e) {
                      return $("<input>", { value: soapAction, type: "text"});
                    });
    } else {
      soapActionNode.find("soap-action")
                    .remove();
    }

    var soapBodyNode = root_node.find("soap-body")
                                 .contents()
                                .filter(function() {
                                  return this.nodeType == Node.COMMENT_NODE;
                                })
                                .get(0);
    var soapBody = soapBodyNode != null ? soapBodyNode.data : "";
    var newSoapBodyNode = $("<textarea>").text(soapBody.trim());
    root_node.find("soap-body")
             .replaceWith(newSoapBodyNode);
    newSoapBodyNode.before("<span>SOAP Body</span>");


    var select = $("<select>", { } ).appendTo(root_node);
    $("<option>", { disabled: true,
                    selected: true,
                    label: "Select an authentication mechanism..." } ).appendTo(select);
    // Populate the dropdown list with custom auth. schemes
    if (typeof custom_auth_schemes === "function") {
      custom_auth_schemes(select, soap_options);
    }

    // Then, create the submit button
    var button = $("<input>", { 'type': 'submit',
                                'value': 'Try it out !'} ).appendTo(root_node);

    // SOAP Response section
    var response_div = $("<div>", {'class': 'hidden'});
    root_node.append(response_div);

    // SOAP Request
    response_div.append($("<h2>SOAP Request Sent</h2>"));
    var requestNode = $("<textarea>", { "readonly": true });
    requestNode.appendTo(response_div);

    // SOAP Response
    response_div.append($("<h2>SOAP Response Received</h2>"));
    var responseNode = $("<textarea>", { "readonly": true });
    responseNode.appendTo(response_div);

    button.on('click', function (e) {
      // stop the form to be submitted...
      e.preventDefault();

      // empty the request and response panes
      requestNode.empty();
      responseNode.empty();

      // Show the request and response pane
      response_div.removeClass("hidden");

      // Get the SOAP Body from the HTML form
      soap_options.data = newSoapBodyNode.val();

      soap_options.beforeSend = function (soap) {
        // Dump Request Line
        var request = "POST " + soap_options.url + "\n";

        // Dump Headers
        if (soap_options.HTTPHeaders != null) {
          for (var k in soap_options.HTTPHeaders) {
            if (soap_options.HTTPHeaders.hasOwnProperty(k)) {
              request += k + ": " + soap_options.HTTPHeaders[k] + "\n";
            }
          }
        }
        request += "\n";

        // Dump the SOAP Request
        request += vkbeautify.xml(soap.toString(), 2);
        requestNode.text(request);
      };
      soap_options.success = function (soapResponse) {
        var responseText = "HTTP " + soapResponse.httpCode + " "
                                   + soapResponse.httpText + "\n\n"
                                   + vkbeautify.xml(soapResponse.toString(), 2);
        responseNode.text(responseText);
      };
      soap_options.error = function (soapResponse, xhr) {
        if (soapResponse.httpCode == 0) { // Network error
          responseNode.text("Could not get a reponse from server. Check network connectivity and SSL/TLS certificates.");
        } else {
          var responseText = "HTTP " + soapResponse.httpCode + " "
                                     + soapResponse.httpText + "\n\n"
                                     + vkbeautify.xml(soapResponse.toString(), 2);
          responseNode.text(responseText);
        }
      };
      $.soap(soap_options);
    });

  };

  $.soapui = soapui;
  $.threescale_authentication = threescale_authentication;
  return $;
});
