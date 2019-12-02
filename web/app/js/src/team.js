/**
 * @author Nicolas CARPi <nicolas.carpi@curie.fr>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */

$(document).ready(function() {
  var read = 'one';
  var editable = true;
  var selectable = true;
  if ($('#info').data('all')) {
    read = 'all';
    editable = false;
    selectable = false;
  }

  // SCHEDULER
  $('#scheduler').fullCalendar({
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'agendaWeek'
    },
    // i18n
    locale: $('#info').data('lang'),
    defaultView: 'agendaWeek',
    // allow selection of range
    selectable: selectable,
    // draw an event while selecting
    selectHelper: true,
    editable: editable,
    // allow "more" link when too many events
    eventLimit: true,
    // load the events as JSON
    eventSources: [
      {
        url: 'app/controllers/SchedulerController.php',
        type: 'POST',
        data: {
          read: read,
          item: $('#info').data('item')
        },
        error: function() {
          notif({'msg': 'There was an error while fetching events!', 'res': false});
        }
      }
    ],
    // first day is monday
    firstDay: 1,
    // remove possibility to book whole day, might add it later
    allDaySlot: false,
    // day start at 6 am
    minTime: '06:00:00',
    eventBackgroundColor: 'rgb(41,174,185)',
    dayClick: function(start, end) {
      if (!editable) { return; }
      schedulerCreate(start.format(), end.format());
    },
    // selection
    select: function(start, end) {
      if (!editable) { return; }
      schedulerCreate(start.format(), end.format());
    },
    // on click activate modal window
    eventClick: function(calEvent) {
      if (!editable) { return; }
      $('#rmBind').hide();
      $('#eventModal').modal('toggle');
      // delete button in modal
      $('#deleteEvent').on('click', function() {
        $.post('app/controllers/SchedulerController.php', {
          destroy: true,
          id: calEvent.id
        }).done(function(json) {
          notif(json);
          if (json.res) {
            $('#scheduler').fullCalendar('removeEvents', calEvent.id);
            $('#eventModal').modal('toggle');
          }
        });
      });
      // fill the bound div
      $('#eventTitle').text(calEvent.title);
      if (calEvent.experiment != null) {
        $('#eventBound').text('Event is bound to an experiment.');
        $('#rmBind').show();
      }
      // bind an experiment to the event
      $('#goBind').on('click', function() {
        $.post('app/controllers/SchedulerController.php', {
          bind: true,
          id: calEvent.id,
          expid: parseInt($('#bindinput').val(), 10),
        }).done(function(json) {
          notif(json);
          if (json.res) {
            $('#bindinput').val('');
            $('#eventModal').modal('toggle');
            window.location.replace('team.php?tab=1&item=' + $('#info').data('item'));
          }
        });
      });
      // remove the binding
      $('#rmBind').on('click', function() {
        $.post('app/controllers/SchedulerController.php', {
          unbind: true,
          id: calEvent.id,
        }).done(function(json) {
          $('#eventModal').modal('toggle');
          notif(json);
          window.location.replace('team.php?tab=1&item=' + $('#info').data('item'));
        });
      });
    },
    // on mouse enter add shadow and show title
    eventMouseover: function(calEvent) {
      if (editable) {
        $(this).css('box-shadow', '5px 4px 4px #474747');
      }
      $(this).attr('title', calEvent.title);
    },
    // remove the box shadow when mouse leaves
    eventMouseout: function() {
      $(this).css('box-shadow', 'unset');
    },
    // a drop means we change start date
    eventDrop: function(calEvent) {
      if (!editable) { return; }
      $.post('app/controllers/SchedulerController.php', {
        updateStart: true,
        start: calEvent.start.format(),
        end: calEvent.end.format(),
        id: calEvent.id
      }).done(function(json) {
        notif(json);
      });
    },
    // a resize means we change end date
    eventResize: function(calEvent) {
      if (!editable) { return; }
      $.post('app/controllers/SchedulerController.php', {
        updateEnd: true,
        end: calEvent.end.format(),
        id: calEvent.id
      }).done(function(json) {
        notif(json);
      });
    },
    eventRender: function(event, element) {
      var title = element.find('.fc-title');
      title.html(title.text());
    }

  });
  // BIND AUTOCOMPLETE
  let cache = {};
  $('#bindinput').autocomplete({
    source: function(request, response) {
      let term = request.term;
      if (term in cache) {
        response(cache[term]);
        return;
      }
      $.getJSON('app/controllers/EntityAjaxController.php?source=experiments', request, function(data) {
        cache[term] = data;
        response(data);
      });
    }
  });

});

// IMPORT TPL
$(document).on('click', '.importTpl', function() {
  $.post('app/controllers/AjaxController.php', {
    importTpl: true,
    id: $(this).data('id')
  }).done(function(json) {
    notif(json);
  });
});

function schedulerCreate(start, end) {
  var title = prompt('Comment:');
  if (title) {
    // add it to SQL
    $.post('app/controllers/SchedulerController.php', {
      create: true,
      start: start,
      end: end,
      title: title,
      item: $('#info').data('item')
    }).done(function(json) {
      notif(json);
      if (json.res) {
        window.location.replace('team.php?tab=1&item=' + $('#info').data('item'));
      }
    });
  }
}
