// Generated by CoffeeScript 1.6.3
(function() {
  var BOARD_ID, GCAL_FEED_URL_LS_KEY, NAME_TO_INITIALS_MAPPING, PIPEDRIVE_API_BASE, PIPEDRIVE_API_KEY_LS_KEY, REFRESH_INTERVAL, formatCardMetaData, getBoardCards, getCompletedCards, getHash, getMonday, getPipedriveActivities, handleFeed, inPast, loadInitialData, setAvatarStyle, updateCalendar, updateGcal, updatePipedrive;

  BOARD_ID = 'UsP5zlas';

  REFRESH_INTERVAL = 60000;

  GCAL_FEED_URL_LS_KEY = 'arachnysDashboardFeedUrl';

  PIPEDRIVE_API_KEY_LS_KEY = 'arachnysPipedriveApiKey';

  PIPEDRIVE_API_BASE = 'https://api.pipedrive.com/v1';

  NAME_TO_INITIALS_MAPPING = {
    "David Buxton": "DB",
    "Mike Cerillo": "MC",
    "Lynn Petesch": "L",
    "Aaron Tanner": "AT",
    "Hollie Tu": "HT",
    "Enric Castane": "EC",
    "Minna Cowper-Coles": "MCC",
    "Board Members": "BM",
    "david": "DB",
    "harry": "HW",
    "matthew": "MB",
    "mateusz": "MK",
    "james": "JP"
  };

  window.calendarEvents = {};

  window.organizationMembers = {};

  window.organizationMembersInitials = {};

  window.boardLists = {};

  window.onAuthorize = function() {
    updateLoggedIn();
    $("#output").empty();
    return loadInitialData(getBoardCards);
  };

  getMonday = function(d) {
    var day, diff, _ref;
    d = new Date(d);
    day = d.getDay();
    diff = d.getDate() - day + ((_ref = day === 0) != null ? _ref : -{
      6: 1
    });
    return new Date(d.setDate(diff));
  };

  getBoardCards = function(callback) {
    var $noDueDate;
    getCompletedCards();
    $noDueDate = $('#no-due-date');
    $('<div>').text('Loading...').appendTo($noDueDate);
    return Trello.get("boards/" + BOARD_ID + "/cards?filter=visible", function(cards) {
      var firstOfWeek, now, prevBoardName;
      $noDueDate.empty();
      $('<h4>No due date</h4>').appendTo($noDueDate);
      window.calendarEvents.trello = [];
      prevBoardName = null;
      now = new Date();
      firstOfWeek = getMonday(now);
      $.each(cards, function(ix, card) {
        var boardName, cls, dueDate, link, metadata;
        metadata = formatCardMetaData(card.idMembers);
        boardName = window.boardLists[card.idList].name;
        if (boardName === "Complete") {
          cls = "event-success event-fade " + metadata.avatarString + " " + (metadata.avatarString !== '' ? 'event-large' : '');
        } else if (boardName === "In progress") {
          cls = "event-progress " + metadata.avatarString + " " + (metadata.avatarString !== '' ? 'event-large' : '') + " " + (inPast(card.due, now) ? 'event-in-past' : '');
        } else {
          cls = "event-not-started " + metadata.avatarString + " " + (metadata.avatarString !== '' ? 'event-large' : '') + " " + (inPast(card.due, now) ? 'event-in-past' : '');
        }
        dueDate = new Date(card.due).getTime();
        if (card.due && dueDate > firstOfWeek.getTime()) {
          return window.calendarEvents.trello.push({
            id: card.url,
            title: "" + card.name + metadata.membersString,
            url: card.url,
            start: dueDate,
            end: dueDate,
            "class": cls
          });
        } else {
          if (prevBoardName !== boardName) {
            $("<h5>").text("" + boardName).appendTo($noDueDate);
          }
          link = $("<a>").attr({
            href: card.url,
            target: "trello"
          }).addClass("card " + cls);
          link.text("" + card.name + metadata.membersString).appendTo($noDueDate);
          return prevBoardName = boardName;
        }
      });
      updateCalendar();
      return setTimeout(getBoardCards, REFRESH_INTERVAL);
    });
  };

  inPast = function(eventStart, now) {
    var startDate;
    startDate = new Date(eventStart);
    if (eventStart == null) {
      return false;
    }
    return (now.getTime() - startDate.getTime()) > 0;
  };

  formatCardMetaData = function(members) {
    var i, m, metadata;
    metadata = {};
    metadata.initials = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = members.length; _i < _len; _i++) {
        m = members[_i];
        _results.push(window.organizationMembers[m].initials);
      }
      return _results;
    })();
    if (metadata.initials.length !== 0) {
      metadata.membersString = " [" + (metadata.initials.join(', ')) + "]";
      metadata.avatarStyles = (function() {
        var _i, _len, _ref, _results;
        _ref = metadata.initials;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _results.push("avatar-" + i);
        }
        return _results;
      })();
      metadata.avatarString = "" + (metadata.avatarStyles.join(' '));
    } else {
      metadata.membersString = "";
      metadata.avatarString = "";
    }
    return metadata;
  };

  getCompletedCards = function() {
    return Trello.get("boards/" + BOARD_ID + "/cards?filter=closed&limit=100", function(cards) {
      var $complete, $row, card, cardClosedDate, closedCards, count, daysAgoClosed, metadata, now, _i, _j, _len, _len1, _results;
      closedCards = [];
      now = new Date();
      for (_i = 0, _len = cards.length; _i < _len; _i++) {
        card = cards[_i];
        cardClosedDate = new Date(card.dateLastActivity);
        daysAgoClosed = (now - cardClosedDate) / 1000 / 3600 / 24;
        if (daysAgoClosed <= 7.0) {
          closedCards.push(card);
        }
      }
      $complete = $('#completed-cards').empty();
      $("<h4>Completed/archived cards in last 7 days: " + closedCards.length + "</h4>").appendTo($complete);
      count = 0;
      _results = [];
      for (_j = 0, _len1 = closedCards.length; _j < _len1; _j++) {
        card = closedCards[_j];
        metadata = formatCardMetaData(card.idMembers);
        if (count % 4 === 0) {
          $row = $("<div class='row'></div>").appendTo($complete);
        }
        $("<div class='col-md-3 card'><div class='card-inner " + metadata.avatarString + "'><i class='fa fa-trello'></i> <a href='" + card.url + "'>" + card.name + metadata.membersString + "</a></div></div>").appendTo($row);
        _results.push(count++);
      }
      return _results;
    });
  };

  loadInitialData = function(callback) {
    return Trello.members.get("me", function(member) {
      $("#fullName").text(member.fullName);
      return Trello.get("organizations/arachnys1/members?fields=all", function(members) {
        var _i, _len;
        for (_i = 0, _len = members.length; _i < _len; _i++) {
          member = members[_i];
          window.organizationMembers[member.id] = member;
          window.organizationMembersInitials[member.initials] = member;
          setAvatarStyle(member.initials, member.avatarHash);
        }
        return Trello.get("boards/" + BOARD_ID + "/lists", function(lists) {
          var list, _j, _len1;
          for (_j = 0, _len1 = lists.length; _j < _len1; _j++) {
            list = lists[_j];
            window.boardLists[list.id] = list;
          }
          return callback();
        });
      });
    });
  };

  setAvatarStyle = function(initials, avatarHash) {
    var imageUrl;
    imageUrl = "https://trello-avatars.s3.amazonaws.com/" + avatarHash + "/30.png";
    return $("<style type='text/css'>.avatar-" + initials + " { background-image: url('" + imageUrl + "'); background-repeat: no-repeat; background-position-x:right; } </style>").appendTo('head');
  };

  window.updateLoggedIn = function() {
    var isLoggedIn;
    isLoggedIn = Trello.authorized();
    $("#loggedout").toggle(!isLoggedIn);
    return $("#loggedin").toggle(isLoggedIn);
  };

  window.logout = function() {
    Trello.deauthorize();
    return updateLoggedIn();
  };

  window.getFeed = function() {
    var service;
    service = new google.gdata.calendar.CalendarService('arachnys');
    return service.getEventsFeed(FEED_URL, handleFeed, handleError);
  };

  getHash = function(str) {
    var char, code, hash, _i, _len;
    hash = 0;
    if (str.length === 0) {
      return 0;
    }
    for (_i = 0, _len = str.length; _i < _len; _i++) {
      char = str[_i];
      code = char.charCodeAt(0);
      hash = ((hash << 5) - hash) + code;
      hash |= 0;
    }
    return hash;
  };

  handleFeed = function(feed) {
    var entries, entry, initials, member, metadata, _i, _len;
    window.calendarEvents.gcal = [];
    entries = feed.entry;
    for (_i = 0, _len = entries.length; _i < _len; _i++) {
      entry = entries[_i];
      initials = NAME_TO_INITIALS_MAPPING[entry.title.$t.toLowerCase()];
      if ((!initials) || (organizationMembersInitials[initials] == null)) {
        console.error("No initials for", entry.title.$t);
        return;
      }
      member = organizationMembersInitials[initials];
      metadata = formatCardMetaData([member.id]);
      window.calendarEvents.gcal.push({
        id: getHash(entry.id.$t),
        title: "" + entry.title.$t + " on tech duty",
        url: entry.link[0].href,
        start: new Date(entry['gd$when'][0]['startTime']).getTime(),
        end: new Date(entry['gd$when'][0]['endTime']).getTime(),
        "class": "event-warning " + metadata.avatarString + " event-large"
      });
    }
    return updateCalendar();
  };

  updateCalendar = function(events) {
    var flat, item, source, _i, _len, _ref;
    flat = [];
    _ref = window.calendarEvents;
    for (source in _ref) {
      events = _ref[source];
      for (_i = 0, _len = events.length; _i < _len; _i++) {
        item = events[_i];
        flat.push(item);
      }
    }
    window.calendar.setOptions({
      events_source: flat
    });
    window.calendar2.setOptions({
      events_source: flat
    });
    window.calendar.view();
    return window.calendar2.view();
  };

  updateGcal = function() {
    var feedUrl, url;
    feedUrl = JSON.parse(localStorage.getItem(GCAL_FEED_URL_LS_KEY));
    if (!feedUrl) {
      url = window.prompt('Enter Google Calendar feed URL for tech rota (should end with /full)');
      localStorage.setItem(GCAL_FEED_URL_LS_KEY, JSON.stringify(url));
      feedUrl = JSON.parse(localStorage.getItem(GCAL_FEED_URL_LS_KEY));
    }
    if (feedUrl) {
      return $.getJSON("" + feedUrl + "?alt=json-in-script&callback=?", function(data) {
        handleFeed(data.feed);
        return setTimeout(updateGcal, REFRESH_INTERVAL);
      });
    } else {
      return window.alert('Not possible to load Google Calendar data');
    }
  };

  updatePipedrive = function() {
    var apiKey, key;
    apiKey = JSON.parse(localStorage.getItem(PIPEDRIVE_API_KEY_LS_KEY));
    if (!apiKey) {
      key = window.prompt('Enter Pipedrive API key');
      localStorage.setItem(PIPEDRIVE_API_KEY_LS_KEY, JSON.stringify(key));
      apiKey = JSON.parse(localStorage.getItem(PIPEDRIVE_API_KEY_LS_KEY));
    }
    if (apiKey) {
      setTimeout(updatePipedrive, REFRESH_INTERVAL);
      return getPipedriveActivities(apiKey);
    } else {
      return window.alert('Not possible to load Pipedrive data');
    }
  };

  getPipedriveActivities = function(apiKey) {
    window.calendarEvents.pipedrive = [];
    return $.getJSON("" + PIPEDRIVE_API_BASE + "/users?api_token=" + apiKey, function(data) {
      var u, user, userHash, users, _i, _j, _len, _len1, _results;
      users = data.data;
      userHash = {};
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        u = users[_i];
        userHash[u.id] = u;
      }
      _results = [];
      for (_j = 0, _len1 = users.length; _j < _len1; _j++) {
        user = users[_j];
        _results.push($.getJSON("" + PIPEDRIVE_API_BASE + "/activities/?done=0&api_token=" + apiKey + "&user_id=" + user.id, function(activityData) {
          var activity, date, initials, member, metadata, _k, _len2, _ref;
          if (activityData.data == null) {
            return;
          }
          _ref = activityData.data;
          for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
            activity = _ref[_k];
            date = new Date(activity.due_date).getTime();
            user = userHash[activity.user_id];
            initials = NAME_TO_INITIALS_MAPPING[user.name];
            if ((!initials) || (organizationMembersInitials[initials] == null)) {
              console.error("No initials for", user);
              return;
            }
            member = organizationMembersInitials[initials];
            metadata = formatCardMetaData([member.id]);
            window.calendarEvents.pipedrive.push({
              id: activity.id,
              title: "" + activity.subject + " " + metadata.membersString,
              url: "https://app.pipedrive.com/org/details/" + activity.org_id,
              start: date,
              end: date,
              "class": "event-warning " + metadata.avatarString + " event-large"
            });
          }
          return updateCalendar();
        }));
      }
      return _results;
    });
  };

  window.getEventLine = function(eventHash, idx) {
    var hasItem, k, ret, v;
    ret = {};
    hasItem = false;
    for (k in eventHash) {
      v = eventHash[k];
      if (idx < v.length) {
        hasItem = true;
        ret[k] = v[idx];
      } else {
        ret[k] = null;
      }
    }
    if (hasItem) {
      return ret;
    } else {
      return {};
    }
  };

  $(function() {
    window.calendar = $('#calendar').calendar({
      first_day: 1,
      show_weekends: 0,
      events_source: []
    });
    window.calendar2 = $('#calendar2').calendar({
      first_day: 1,
      show_weekends: 0,
      events_source: []
    });
    window.calendar.view('week');
    window.calendar2.view('week');
    window.calendar2.navigate('next');
    return setTimeout(updateGcal, 1000);
  });

}).call(this);
