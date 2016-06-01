var clientId = '646982865980.apps.googleusercontent.com';
var apiKey = "AIzaSyDF0BadJ4ZCRS53dLklo36NHLrv6ySdv9U";
var scopes = 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email';
var ultradoxPublicKey = "j6jW2BgV5bYBiHPFTQyJCTqgFkrbrH";
var runUrl = "";

function print() {
    var printButton = document.getElementById('print-button');
    printButton.innerHTML = 'Plane Under Construction';
    printButton.style.backgroundImage = "url('printing.gif')";
    printButton.className = "info";
    printButton.onclick = null;
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            var printButton = document.getElementById('print-button');
            printButton.style.backgroundImage = "url('done.png')";
            printButton.innerHTML = "Ready For Takeoff!";
        }
    }
    request.open("GET", runUrl, true);
    request.send();
}

function load() {
    var authorizeButton = document.getElementById('load-button');
    authorizeButton.className = 'loading';
    authorizeButton.disabled = true;
    gapi.client.load('oauth2', 'v2', function() {
        gapi.client.oauth2.userinfo.get().execute(function(resp) {
            // Shows user email
            var email = resp.email;
            gapi.client.load('plus', 'v1', function() {
                printUser('me', email);
                authorizeButton.className = 'reload';
                authorizeButton.disabled = false;
            });
        });
    });
}

function handleClientLoad() {
    gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuth, 1);
}

function checkAuth() {
    gapi.auth.authorize({
            client_id: clientId,
            scope: scopes,
            immediate: true
        }, handleAuthResult);
}

function handleAuthResult(authResult) {
    var authorizeButton = document.getElementById('load-button');
    authorizeButton.style.visibility = 'visible';
    if (authResult && !authResult.error) {
        authorizeButton.innerHTML = 'Reload Profile';
        authorizeButton.onclick = load;
        authorizeButton.style.visibility = 'hidden';
        load();
    } else {
        authorizeButton.onclick = handleAuthClick;
    }
}

function handleAuthClick(event) {
    gapi.auth.authorize({
            client_id: clientId,
            scope: scopes,
            immediate: false
        }, handleAuthResult);
    return false;
}

function printUser(userId, email) {
    htmlLog('Getting profile: ' + userId + ', email=' + email);
    var request = gapi.client.plus.people.get({
            'userId': userId
        });
    request
        .execute(function(resp) {
            if (resp == null) {
                htmlLog('Empty response.');
            } else if (resp.error != null) {
                htmlLog('Response error (' + resp.error.code + ') ' + resp.error.message);
            } else {
                htmlLog(resp);
                var name = resp.displayName;
                var phone = '';
                var address = 'san francisco,california';
                var image = '';
                var company = '';
                var title = '';
                if (resp.placesLived && resp.placesLived.length) {
                    var primaryAddresses = resp.placesLived
                        .filter(function(address) {
                            return address.primary;
                        });
                    if (primaryAddresses.length) {
                        address = primaryAddresses[0].value;
                    }
                }
                if (resp.organizations && resp.organizations.length) {
                    var primaryOrganizations = resp.organizations
                        .filter(function(company) {
                            return company.type == 'work';
                        });
                    if (primaryOrganizations.length) {
                        company = primaryOrganizations[0].name;
                        title = primaryOrganizations[0].title;
                    }
                }
                var qrcode = "http://api.qrserver.com/v1/create-qr-code/?data=BEGIN%3AVCARD%0AVERSION%3A2.1%0AFN%3A" + encodeURI(name) + "%0ATEL%3BHOME%3BVOICE%3A" + encodeURI(phone);
                var url = "http://www.ultradox.com/ultradoc/execute?id=" + ultradoxPublicKey + "&email=" + email + "&action=RUN" + "&name=" + encodeURI(name) + "&address=" + encodeURI(address) + "&company=" + encodeURI(company) + "&title=" + encodeURI(title) + "&qrcode=" + encodeURI(qrcode);
                if (resp.image && resp.image.url) {
                    url += "&photo=" + encodeURI(resp.image.url.replace(
                            "sz=50", "sz=250"));
                }
                var printButton = document
                    .getElementById('print-button');
                printButton.style.visibility = 'visible';
                printButton.onclick = print;
                runUrl = url;
            }
        });
}

function htmlLog(message) {
    console.log(message);
}