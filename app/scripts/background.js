'use strict';

moment.locale('es');

var getNotificationId = function() {
  var id = Math.floor(Math.random() * 9007199254740992) + 1;
  return id.toString();
};

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('Previous version', details.previousVersion);
});

var sendRegistrationId = function (registrationId) {
  // Send the registration token to your application server
  // in a secure way.
  $.ajax({
    type: 'POST',
    url: CONFIG.API_URL + '/0/dispositivos',
    data: {
      tipo: 'gcm',
      id: registrationId
    },
    dataType: 'json',
    success: function (data, textStatus, jqXHR) {
      chrome.storage.local.set({
        registered: true,
        id: registrationId
      });
    }
  });
};

var registerCallback = function (registrationId) {
  if (chrome.runtime.lastError) {
    // When the registration fails, handle the error and retry the
    // registration later.
    return;
  }

  // Send the registration token to your application server.
  sendRegistrationId(registrationId);
};

var checkRegistration = function () {
  chrome.storage.local.get('registered', function (result) {
    // If already registered, bail out.
    if (result.registered) {
      return;
    }

    chrome.gcm.register(['524747703333'], registerCallback);
  });
};

var setBadge = function (status) {
  var badgeText;
  var badgeBackgroundColor;

  switch (status) {
    case 'Emergencia Ambiental':
      badgeText = 'Emrg';
      badgeBackgroundColor = '#9C27B0';
      break;
    case 'Preemergencia Ambiental':
      badgeText = 'Pmrg';
      badgeBackgroundColor = '#F44336';
      break;
    case 'Alerta Ambiental':
      badgeText = 'Alrt';
      badgeBackgroundColor = '#EF6C00';
      break;
  }

  chrome.browserAction.setBadgeText({text: (badgeText) ? badgeText : ''});
  if (badgeBackgroundColor) {
    chrome.browserAction.setBadgeBackgroundColor({color: badgeBackgroundColor});
  }
};

var firstLoad = function () {
  checkRegistration();

  $.ajax({
    url: CONFIG.API_URL + '/0/restricciones?fecha=' + moment().format('YYYY-MM-DD'),
    dataType: 'json',
    success: function (data, textStatus, jqXHR) {
      if (data.length < 1) {
        return;
      }

      setBadge(data[0].estado);
    }
  });
};

var showGcmNotification = function (message) {
  if (message.data.tipo === 'restricciones') {
    var date = moment(message.data.fecha, 'YYYY-MM-DD').format('dddd DD MMMM YYYY');

    setBadge(message.data.estado);

    chrome.notifications.create(
      getNotificationId(),
      {
        title: 'Restriccion-SCL',
        iconUrl: 'images/icon-128.png',
        type: 'list',
        message: 'Restricción ' + date,
        items: [
          {title: 'Día', message: date},
          {title: 'Sin sello verde', message: message.data.sin_sello_verde || 'Sin restricción'},
          {title: 'Con sello verde', message: message.data.con_sello_verde || 'Sin restricción'},
          {title: 'Calidad aire', message: message.data.estado || 'No disponible'},
          {title: 'Fuente', message: message.data.fuente || 'No disponible'}
        ]
      },
      function () {}
    );
  }
};

chrome.runtime.onInstalled.addListener(firstLoad);
chrome.runtime.onStartup.addListener(firstLoad);

chrome.gcm.onMessage.addListener(showGcmNotification);
