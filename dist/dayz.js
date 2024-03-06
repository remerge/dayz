(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('react'), require('prop-types'), require('moment'), require('moment-range'), require('react-dom')) :
  typeof define === 'function' && define.amd ? define(['react', 'prop-types', 'moment', 'moment-range', 'react-dom'], factory) :
  (global = global || self, global.dayz = factory(global.React, global.PropTypes, global.moment, global['moment-range'], global.ReactDOM));
}(this, function (React, PropTypes, moment$1, momentRange, ReactDOM) { 'use strict';

  React = React && React.hasOwnProperty('default') ? React['default'] : React;
  PropTypes = PropTypes && PropTypes.hasOwnProperty('default') ? PropTypes['default'] : PropTypes;
  moment$1 = moment$1 && moment$1.hasOwnProperty('default') ? moment$1['default'] : moment$1;
  ReactDOM = ReactDOM && ReactDOM.hasOwnProperty('default') ? ReactDOM['default'] : ReactDOM;

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(source, true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(source).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  // A event may be split into one or more durations in order to be split across week boundaries

  class EventDuration {
    constructor(layout, event, displayRange) {
      this.layout = layout;
      this.event = event;
      this.stack = 0;
      this.displayRange = displayRange;
      this.startsBefore = event.start.isBefore(displayRange.start);
      this.endsAfter = event.end.isAfter(displayRange.end);

      if (this.layout.isDisplayingAsMonth) {
        this.range = moment$1.range(moment$1.max(displayRange.start, event.start.startOf('day')), moment$1.min(displayRange.end, event.end.endOf('day')));
      } else {
        this.range = moment$1.range(moment$1.max(displayRange.start, event.start), moment$1.min(displayRange.end, event.end));
      }

      this.span = Math.max(1, Math.ceil(this.range.end.diff(this.range.start, 'day', true)));
    }

    isEditing() {
      return this.first && this.event.isEditing();
    }

    startsOnWeek() {
      return 0 === this.event.start.weekday();
    }

    adjustEventTime(startOrEnd, position, height) {
      if (position < 0 || position > height) {
        return;
      }

      var time = this.event[startOrEnd].startOf('day').add(this.layout.displayHours[0], 'hours').add(this.layout.minutesInDay() * (position / height), 'minutes');
      var {
        step
      } = this.event.get('resizable');

      if (step) {
        var rounded = Math.round(time.minute() / step) * step;
        time.minute(rounded).second(0);
      }

      this.event.emit('change');
    }

    inlineStyles() {
      if ('month' === this.layout.displayingAs() || !this.event.isSingleDay()) {
        return {};
      }

      var {
        start,
        end
      } = this.event.daysMinuteRange();
      var startOffset = this.layout.displayHours[0] * 60;
      var endOffset = this.layout.displayHours[1] * 60;
      start = Math.max(start - startOffset, 0);
      end = Math.min(end, endOffset) - startOffset;
      var inday = this.layout.minutesInDay();
      var top = "".concat((start / inday * 100).toFixed(2), "%");
      var bottom = "".concat((100 - end / inday * 100).toFixed(2), "%");
      return {
        top,
        bottom
      };
    }

    isResizable() {
      return this.layout.displayingAs() !== 'month' && this.event.get('resizable');
    }

    key() {
      return this.displayRange.start.format('YYYYMMDD') + this.event.key;
    }

    setIsResizing(val) {
      this.isResizing = val;
    }

    classNames() {
      var classes = ['event', "span-".concat(this.span)];

      if (this.event.colorIndex) {
        classes.push("color-".concat(this.event.colorIndex));
      }

      if (this.isResizing) classes.push('is-resizing');
      if (this.startsBefore) classes.push('is-continuation');
      if (this.endsAfter) classes.push('is-continued');
      if (this.stack) classes.push("stack-".concat(this.stack));
      if (this.isEditing()) classes.push('is-editing');
      if (this.isResizable()) classes.push('is-resizable');

      if (this.event.className) {
        classes.push(this.event.className);
      }

      return classes.join(' ');
    }

  }

  var C = {
    eventHeight: 20 // px

  };

  var moment = momentRange.extendMoment(moment$1);

  var Emitter = require('tiny-emitter');

  var EVENT_COUNTER = 1;
  class Event {
    constructor(attributes) {
      this.attributes = attributes;
      this.isEvent = true;
      EVENT_COUNTER += 1;
      this.key = EVENT_COUNTER;

      if (!this.attributes.range) {
        throw new Error('Must provide range');
      }
    }

    render() {
      if (this.attributes.render) {
        return this.attributes.render({
          event: this
        });
      }

      return this.defaultRenderImplementation();
    }

    defaultRenderImplementation() {
      return React.createElement('div', {}, this.attributes.content || this.attributes.range.start.format('MMM DD YYYY'));
    }

    get(key) {
      return this.attributes[key];
    }

    set(attributes, options) {
      var changed = false;
      var keys = Object.keys(attributes);

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        if (this.attributes[key] !== attributes[key]) {
          changed = true;
          break;
        }
      }

      if (!changed) {
        return;
      }

      Object.assign(this.attributes, attributes);
      this.emitChangeEvent(options);
    }

    isEditing() {
      return !!this.attributes.editing;
    }

    setEditing(isEditing) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (isEditing !== this.isEditing()) {
        this.attributes.editing = isEditing;
      }

      this.emitChangeEvent(options);
    }

    emitChangeEvent() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (this.collection) {
        this.collection.emit('change', this);
      }

      if (!options || !options.silent) {
        this.emit('change', this);
      }
    }

    range() {
      return this.attributes.range.clone();
    }

    isSingleDay() {
      var maxDiff = this.attributes.range.start.isDST() ? 25 : 24;
      return maxDiff > this.attributes.range.end.diff(this.attributes.range.start, 'hours');
    }

    daysMinuteRange() {
      var startOfDay = this.attributes.range.start.clone().startOf('day');
      return {
        start: this.attributes.range.start.diff(startOfDay, 'minute'),
        end: this.attributes.range.end.diff(startOfDay, 'minute')
      };
    }

    get content() {
      return this.attributes.content;
    }

    get start() {
      return this.attributes.range.start;
    }

    get end() {
      return this.attributes.range.end;
    }

    get colorIndex() {
      return this.attributes.colorIndex || 0;
    }

    get className() {
      return this.attributes.className || '';
    }

    remove() {
      this.collection.remove(this);
      this.isDeleted = true;
      this.emit('change');
    }

  }
  Object.assign(Event.prototype, Emitter.prototype);

  var Emitter$1 = require('tiny-emitter');

  var lc = event => event.attributes.range.start.diff(event.attributes.range.end);

  var sortEvents = (eventA, eventB) => {
    var a = lc(eventA);
    var b = lc(eventB);
    return a < b ? -1 : a > b ? 1 : 0; // eslint-disable-line no-nested-ternary
  };

  class EventsCollection {
    constructor() {
      var _this = this;

      var events = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        displayAllDay: true,
        displayLabelForAllDays: true
      };
      this.events = [];

      var _loop = function _loop(i, length) {
        if (options.displayAllDay) {
          _this.add(events[i], {
            silent: true
          });
        } else {
          Array.from(events[i].range.snapTo('days').by('day')).map((date, j) => {
            if (false === options.displayLabelForAllDays && j > 0) {
              events[i].content = ' ';
            }

            return _this.add(events[i], {
              silent: true,
              eventDay: date.clone()
            });
          });
        }
      };

      for (var i = 0, {
        length
      } = events; i < length; i += 1) {
        _loop(i);
      }
    }

    add(eventAttrs) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var attrs = this.prepareEventAttributes(eventAttrs, options.eventDay);
      var event = eventAttrs instanceof Event ? eventAttrs : new Event(attrs);
      event.collection = this;
      this.events.push(event);

      if (!options.silent) {
        this.emit('change');
      }

      return event;
    }

    prepareEventAttributes(eventAttrs, eventDay) {
      if (eventDay === undefined) {
        return eventAttrs;
      }

      var attrs = _objectSpread2({}, eventAttrs);

      var rangeEnd = moment.min(attrs.range.end, eventDay.endOf('day')).toDate();
      var rangeStart = moment.max(attrs.range.start, eventDay.startOf('day')).toDate();
      var range = {
        range: moment.range(rangeStart, rangeEnd)
      };
      return _objectSpread2({}, attrs, {}, range);
    }

    forEach(fn) {
      this.events.sort(sortEvents).forEach(fn);
    }

    get length() {
      return this.events.length;
    }

    at(i) {
      return this.events[i];
    }

    remove(event) {
      var index = this.events.indexOf(event);

      if (-1 !== index) {
        this.events.splice(index, 1);
        this.emit('change');
      }
    }

  }
  EventsCollection.Event = Event;
  Object.assign(EventsCollection.prototype, Emitter$1.prototype);

  function cacheKey(day) {
    return day.format('YYYYMMDD');
  }

  function highlightedDaysFinder(days) {
    var highlighted = Object.create(null);
    days.forEach(d => {
      highlighted[cacheKey(moment(d))] = true;
    });
    return day => highlighted[cacheKey(day)] ? 'highlight' : false;
  } // a layout describes how the calendar is displayed.


  class Layout {
    constructor(options) {
      this.cache = Object.create(null);
      options.date = moment(options.date);
      Object.assign(this, options);
      var cacheMethod = 'day' === this.display ? 'addtoDaysCache' : 'calculateDurations';
      this.calculateRange();

      if (!this.isDisplayingAsMonth && !this.displayHours) {
        this.displayHours = this.hourRange();
      } else {
        this.displayHours = this.displayHours || [0, 24];
      }

      if (options.highlightDays) {
        this.isDayHighlighted = 'function' === typeof options.highlightDays ? options.highlightDays : highlightedDaysFinder(options.highlightDays);
      }

      var multiDayCount = 0;

      if (!this.events) {
        this.events = new EventsCollection();
      }

      var {
        range
      } = this;
      this.events.forEach(event => {
        // we only care about events that are in the range we were provided
        if (range.overlaps(event.range())) {
          this[cacheMethod](event);

          if (!event.isSingleDay()) {
            multiDayCount += 1;
          }
        }
      });
      this.multiDayCount = multiDayCount;
      this.calculateStacking();
    }

    calculateRange() {
      if (this.range) {
        return;
      }

      var start = moment(this.date).locale(this.locale);
      var end = moment(this.date).locale(this.locale);

      if ('week' === this.display) {
        if (this.weekStartsOn !== undefined) {
          start.startOf('isoWeek');
          end.endOf('isoWeek');

          if (0 === this.weekStartsOn && 1 === start.isoWeekday()) {
            start.subtract(1, 'day');
            end.subtract(1, 'day');
          }
        } else {
          start.startOf(this.display);
          end.endOf(this.display);
        }
      } else {
        start.startOf(this.display);
        end.endOf(this.display);
      }

      this.range = moment.range(start, end);

      if (this.isDisplayingAsMonth) {
        var startWeekday;
        var maxWeekday = 6;

        if (this.weekStartsOn !== undefined) {
          startWeekday = this.range.start.isoWeekday();

          if (1 === this.weekStartsOn) {
            startWeekday -= 1;
            maxWeekday += 1;
          }
        } else {
          startWeekday = this.range.start.weekday();
        }

        this.range.start.subtract(startWeekday, 'days');
        var additionalDays = maxWeekday + 1 === this.range.end.isoWeekday() ? 6 : maxWeekday - this.range.end.isoWeekday();
        this.range.end.add(additionalDays, 'days');
      }
    }

    minutesInDay() {
      return (this.displayHours[1] - this.displayHours[0]) * 60;
    }

    propsForDayContainer(_ref) {
      var {
        day,
        position
      } = _ref;
      var classes = ['day'];
      var date = moment(day);

      if (moment(date).isBefore(this.date)) {
        classes.push('before');
      } else if (moment(date).isAfter(this.date)) {
        classes.push('after');
      } else {
        classes.push('current');
      }

      if (this.isDateOutsideRange(date)) {
        classes.push('outside');
      }

      var higlight = this.isDayHighlighted(date, this);

      if (higlight) {
        classes.push(higlight);
      }

      var handlers = {};
      Object.keys(this.dayEventHandlers || {}).forEach(k => {
        handlers[k] = ev => this.dayEventHandlers[k](date, ev);
      });
      return _objectSpread2({
        className: classes.join(' '),
        'data-date': cacheKey(day),
        style: {
          order: position
        }
      }, handlers);
    }

    propsForAllDayEventContainer() {
      var style = this.multiDayCount ? {
        flexBasis: this.multiDayCount * C.eventHeight
      } : {
        display: 'none'
      };
      return {
        className: 'all-day',
        style
      };
    }

    hourRange() {
      var range = [7, 19];
      Array.from(this.range.by('days')).forEach(day => {
        this.forDay(day).forEach(duration => {
          range[0] = Math.min(duration.event.start.hour(), range[0]);
          range[1] = Math.max(duration.event.end.hour(), range[1]);
        });
      });
      range[1] += 1;
      return range;
    }

    getEventsForWeek(start) {
      var day = start.clone();
      var weeklyEvents = [];

      for (var i = 0; i < 7; i++) {
        var durations = this.forDay(day);

        for (var li = 0, {
          length
        } = durations; li < length; li += 1) {
          weeklyEvents.push(durations[li]);
        }

        day.add(1, 'day');
      }

      var minLong = range => moment.max(start, range.start).diff(moment.min(day, range.end), 'minutes');

      return weeklyEvents.sort((al, bl) => {
        var a = minLong(al.event.range());
        var b = minLong(bl.event.range());
        return a === b ? 0 : a > b ? 1 : -1; // eslint-disable-line no-nested-ternary
      });
    }

    calculateStacking() {
      var firstOfWeek = this.range.start.clone().startOf('week');

      do {
        var weeklyEvents = this.getEventsForWeek(firstOfWeek);

        for (var durationIndex = 0; durationIndex < weeklyEvents.length; durationIndex++) {
          var duration = weeklyEvents[durationIndex]; // loop through each duration that is before this one

          var ceilingIndex = 0;

          for (var pi = durationIndex - 1; pi >= 0; pi--) {
            var prevDuration = weeklyEvents[pi];

            if (prevDuration.range.start.isSame(duration.range.start, 'd')) {
              ceilingIndex = pi + 1;
              break;
            }
          }

          for (var _pi = ceilingIndex; _pi < durationIndex; _pi++) {
            var _prevDuration = weeklyEvents[_pi];

            if (duration.range.overlaps(_prevDuration.range)) {
              duration.stack += 1;
            }
          }
        }

        firstOfWeek.add(7, 'day');
      } while (!firstOfWeek.isAfter(this.range.end));
    } // This is the default implementation.
    // It will be overwritten if highlightDays option is provided


    isDayHighlighted() {
      return false;
    }

    isDateOutsideRange(date) {
      return this.isDisplayingAsMonth && !this.date.isSame(date, 'month');
    }

    forDay(day) {
      return this.cache[cacheKey(day)] || [];
    } // a single day is easy, just add the event to that day


    addtoDaysCache(event) {
      var duration = new EventDuration(this, event, this.range);
      this.addToCache(this.range.start, duration);
    } // other durations must break at week boundaries, with indicators if they were/are continuing


    calculateDurations(event) {
      var end = moment.min(this.range.end, event.range().end);
      var start = moment.max(this.range.start, event.range().start).clone();

      do {
        var range = moment.range(start, start.clone().endOf('week'));
        var duration = new EventDuration(this, event, range);
        this.addToCache(start, duration); // go to first day of next week

        start.add(7 - start.weekday(), 'day');
      } while (!start.isAfter(end));
    }

    addToCache(date, duration) {
      var found = false;
      var keys = Object.keys(this.cache);

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        if (this.cache[key].event === duration.event) {
          found = true;
          break;
        }
      }

      if (!found) {
        duration.first = true; // eslint-disable-line no-param-reassign
      }

      var dayCache = this.cache[cacheKey(date)] || (this.cache[cacheKey(date)] = []);
      dayCache.push(duration);
    }

    displayingAs() {
      return this.display;
    }

    get isDisplayingAsMonth() {
      return 'month' === this.display;
    }

  }

  var IsResizeClass = new RegExp('(\\s|^)event(\\s|$)');
  class Event$1 extends React.Component {
    constructor(props) {
      super(props);
      ['onClick', 'onDoubleClick', 'onDoubleClick', 'onDragStart'].forEach(ev => {
        this[ev] = this[ev].bind(this);
      });
    }

    onClick(ev) {
      if (!this.props.onClick) {
        return;
      }

      this.props.onClick(ev, this.props.duration.event);
      ev.stopPropagation();
    }

    onDoubleClick(ev) {
      if (!this.props.onDoubleClick) {
        return;
      }

      this.props.onDoubleClick(ev, this.props.duration.event);
      ev.stopPropagation();
    }

    onDragStart(ev) {
      if (!IsResizeClass.test(ev.target.className)) {
        return;
      }

      var bounds = ReactDOM.findDOMNode(this.refs.element).getBoundingClientRect();
      var resize;

      if (ev.clientY - bounds.top < 10) {
        resize = {
          type: 'start'
        };
      } else if (bounds.bottom - ev.clientY < 10) {
        resize = {
          type: 'end'
        };
      } else {
        return;
      }

      this.props.onDragStart(resize, this.props.duration);
    }

    render() {
      var body = React.createElement("div", {
        className: "evbody",
        onClick: this.onClick
      }, this.props.duration.event.render());
      var Edit = this.props.editComponent;
      var children = this.props.duration.isEditing() ? React.createElement(Edit, {
        event: this.props.duration.event
      }, body) : body;
      return React.createElement("div", {
        ref: "element",
        onMouseDown: this.onDragStart,
        style: this.props.duration.inlineStyles(),
        className: this.props.duration.classNames()
      }, children);
    }

  }
  Event$1.propTypes = {
    duration: PropTypes.instanceOf(EventDuration),
    editComponent: PropTypes.func,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func
  };

  var Label = (_ref) => {
    var {
      day
    } = _ref;
    return React.createElement("div", {
      className: "label"
    }, day.format('D'));
  };

  Label.propTypes = {
    day: PropTypes.object.isRequired
  };

  var IsDayClass = new RegExp('(\\s|^)(events|day|label)(\\s|$)');
  class Day extends React.Component {
    constructor() {
      super();
      this.state = {
        resize: false
      };
      ['onClick', 'onDoubleClick', 'onMouseMove', 'onMouseUp', 'onDragStart'].forEach(ev => {
        this[ev] = this[ev].bind(this);
      });
    }

    get boundingBox() {
      return ReactDOM.findDOMNode(this.refs.events || this.refs.root).getBoundingClientRect();
    }

    onClickHandler(ev, handler) {
      if (!handler || !IsDayClass.test(ev.target.className) || this.lastMouseUp && this.lastMouseUp < new Date().getMilliseconds() + 100) {
        return;
      }

      this.lastMouseUp = 0;
      var bounds = this.boundingBox;
      var perc = Math.max(0.0, (ev.clientY - bounds.top) / ev.target.offsetHeight);
      var hours = this.props.layout.displayHours[0] + this.props.layout.minutesInDay() * perc / 60;
      handler.call(this, ev, this.props.day.clone().startOf('day').add(hours, 'hour'));
    }

    onClick(ev) {
      this.onClickHandler(ev, this.props.handlers.onClick);
    }

    onDoubleClick(ev) {
      this.onClickHandler(ev, this.props.handlers.onDoubleClick);
    }

    onDragStart(resize, eventLayout) {
      eventLayout.setIsResizing(true);
      var bounds = this.boundingBox;
      Object.assign(resize, {
        eventLayout,
        height: bounds.height,
        top: bounds.top
      });
      this.setState({
        resize
      });
    }

    onMouseMove(ev) {
      if (!this.state.resize) {
        return;
      }

      var coord = ev.clientY - this.state.resize.top;
      this.state.resize.eventLayout.adjustEventTime(this.state.resize.type, coord, this.state.resize.height);
      this.forceUpdate();
    }

    onMouseUp(ev) {
      if (!this.state.resize) {
        return;
      }

      this.state.resize.eventLayout.setIsResizing(false);
      setTimeout(() => this.setState({
        resize: false
      }), 1);

      if (this.props.onEventResize) {
        this.props.onEventResize(ev, this.state.resize.eventLayout.event);
      }

      this.lastMouseUp = new Date().getMilliseconds();
    }

    renderEvents() {
      var asMonth = this.props.layout.isDisplayingAsMonth;
      var singleDayEvents = [];
      var allDayEvents = [];
      var onMouseMove = asMonth ? null : this.onMouseMove;
      this.props.layout.forDay(this.props.day).forEach(duration => {
        var event = React.createElement(Event$1, {
          duration: duration,
          key: duration.key(),
          day: this.props.day,
          parent: this,
          onDragStart: this.onDragStart,
          onClick: this.props.onEventClick,
          editComponent: this.props.editComponent,
          onDoubleClick: this.props.onEventDoubleClick
        });
        (duration.event.isSingleDay() ? singleDayEvents : allDayEvents).push(event);
      });
      var events = [];

      if (allDayEvents.length || !asMonth) {
        events.push(React.createElement("div", _extends({
          key: "allday"
        }, this.props.layout.propsForAllDayEventContainer()), allDayEvents));
      }

      if (singleDayEvents.length) {
        events.push(React.createElement("div", {
          key: "events",
          ref: "events",
          className: "events",
          onMouseMove: onMouseMove,
          onMouseUp: this.onMouseUp
        }, singleDayEvents));
      }

      return events;
    }

    render() {
      var props = this.props.layout.propsForDayContainer(this.props);
      return React.createElement("div", _extends({
        ref: "root"
      }, props, {
        onClick: this.onClick,
        onDoubleClick: this.onDoubleClick
      }), React.createElement(Label, {
        day: this.props.day,
        className: "label"
      }, this.props.day.format('D')), this.renderEvents());
    }

  }
  Day.propTypes = {
    day: PropTypes.object.isRequired,
    layout: PropTypes.instanceOf(Layout).isRequired,
    handlers: PropTypes.object,
    position: PropTypes.number.isRequired,
    highlight: PropTypes.func,
    onEventClick: PropTypes.func,
    onEventResize: PropTypes.func,
    editComponent: PropTypes.func,
    onEventDoubleClick: PropTypes.func
  };
  Day.defaultProps = {
    handlers: {}
  };

  class XLabels extends React.Component {
    get days() {
      var days = [];

      if ('day' === this.props.display) {
        days.push(moment$1(this.props.date));
      } else {
        var startOfType = 'week';
        var day = moment$1(this.props.date).locale(this.props.locale);

        if (this.props.weekStartsOn !== undefined) {
          startOfType = 'isoWeek';
          day.startOf(startOfType);

          if (0 === this.props.weekStartsOn && 1 === day.isoWeekday()) {
            day.subtract(1, 'day');
          }
        } else {
          day.startOf(startOfType);
        }

        for (var i = 0; i < 7; i += 1) {
          days.push(day.clone().add(i, 'day'));
        }
      }

      return days;
    }

    get dateFormat() {
      var defaultFormat = 'month' === this.props.display ? 'dddd' : 'ddd, MMM Do';
      return this.props.dateFormat || defaultFormat;
    }

    render() {
      return React.createElement("div", {
        className: "x-labels"
      }, this.days.map(day => React.createElement("div", {
        key: day.format('YYYYMMDD'),
        className: "day-label"
      }, day.locale(this.props.locale).format(this.dateFormat))));
    }

  }
  XLabels.propTypes = {
    display: PropTypes.oneOf(['month', 'week', 'day']),
    date: PropTypes.object.isRequired,
    dateFormat: PropTypes.string,
    locale: PropTypes.string.isRequired,
    weekStartsOn: PropTypes.oneOf([0, 1])
  };

  class YLabels extends React.Component {
    get hours() {
      var [start, end] = this.props.layout.displayHours;
      return Array(end - start).fill().map((_, i) => i + start);
    }

    renderLabels() {
      var day = moment().startOf('hour');
      return this.hours.map(hour => React.createElement("div", {
        key: hour,
        className: "hour"
      }, day.hour(hour).format(this.props.timeFormat)));
    }

    render() {
      if ('month' === this.props.display) {
        return null;
      }

      return React.createElement("div", null, React.createElement("div", {
        className: "y-labels"
      }, React.createElement("div", this.props.layout.propsForAllDayEventContainer(), "All Day"), this.renderLabels()));
    }

  }
  YLabels.propTypes = {
    display: PropTypes.oneOf(['month', 'week', 'day']).isRequired,
    date: PropTypes.object.isRequired,
    layout: PropTypes.instanceOf(Layout).isRequired,
    timeFormat: PropTypes.string
  };
  YLabels.defaultProps = {
    timeFormat: 'ha'
  };

  class Dayz extends React.Component {
    constructor(props) {
      super(props);
      this.layoutFromProps();
    }

    componentDidUpdate(prevProps) {
      // don't calculate layout if update is due to state change
      if (prevProps !== this.props) {
        this.layoutFromProps();
        this.forceUpdate();
      }
    }

    componentWillUnmount() {
      this.detachEventBindings();
    }

    detachEventBindings() {
      if (this.props.events) {
        this.props.events.off('change', this.onEventAdd);
      }
    }

    onEventsChange() {
      this.forceUpdate();
    }

    layoutFromProps() {
      var {
        props
      } = this;

      if (this.props && props.events) {
        this.detachEventBindings();
        props.events.on('change', this.onEventsChange, this);
      }

      this.layout = new Layout(Object.assign({}, props));
    }

    get days() {
      return Array.from(this.layout.range.by('days'));
    }

    renderDays() {
      return this.days.map((day, index) => React.createElement(Day, {
        key: day.format('YYYYMMDD'),
        day: day,
        position: index,
        layout: this.layout,
        editComponent: this.props.editComponent,
        handlers: this.props.dayEventHandlers,
        eventHandlers: this.props.eventHandlers,
        onEventClick: this.props.onEventClick,
        onEventResize: this.props.onEventResize
      }));
    }

    render() {
      var classes = ['dayz', this.props.display];
      return React.createElement("div", {
        className: classes.join(' ')
      }, React.createElement(XLabels, {
        date: this.props.date,
        display: this.props.display,
        dateFormat: this.props.dateFormat,
        locale: this.props.locale,
        weekStartsOn: this.props.weekStartsOn
      }), React.createElement("div", {
        className: "body"
      }, React.createElement(YLabels, {
        layout: this.layout,
        display: this.props.display,
        date: this.props.date,
        timeFormat: this.props.timeFormat
      }), React.createElement("div", {
        className: "days"
      }, this.renderDays(), this.props.children)));
    }

  }
  Dayz.EventsCollection = EventsCollection;
  Dayz.propTypes = {
    date: PropTypes.object.isRequired,
    events: PropTypes.instanceOf(EventsCollection),
    display: PropTypes.oneOf(['month', 'week', 'day']),
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    displayHours: PropTypes.array,
    onEventClick: PropTypes.func,
    editComponent: PropTypes.func,
    onEventResize: PropTypes.func,
    dayEventHandlers: PropTypes.object,
    locale: PropTypes.string,
    highlightDays: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    weekStartsOn: PropTypes.oneOf([0, 1])
  };
  Dayz.defaultProps = {
    display: 'month',
    locale: 'en'
  };

  return Dayz;

}));
