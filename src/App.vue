<template>
  <div class="wrapper" :class="theme">
    <p class="month">{{ month_short }}</p>
    <day v-for="(date, idx) in dates" :key="idx" v-bind="date"></day>
    <details class="settings">
      <summary>Settings</summary>
      <details>
        <summary>Calendars</summary>
        <div>
          <label v-for="(calendar, idx) in calendars" :key="idx">
            <input
              type="checkbox"
              :name="calendar"
              :id="idx"
              :key="idx"
              v-model="selectedCalendars[calendar]"
            />{{ calendar }}</label
          >
        </div>
      </details>
      <details>
        <summary>Theme</summary>
        <input
          type="radio"
          name="theme"
          id="light"
          value="light"
          v-model="theme"
        />
        <label for="light">Light</label>
        <input
          type="radio"
          name="theme"
          id="dark"
          value="dark"
          v-model="theme"
        />
        <label for="dark">Dark</label>
      </details>
    </details>
  </div>
</template>

<style scoped>
summary {
  cursor: pointer;
}

input {
  cursor: pointer;
}

label {
  cursor: pointer;
}

.month {
  grid-column: month;
  grid-row: 1 / span 8;
  margin: 0 auto;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  font-size: 10em;
  text-align: right;
  text-transform: uppercase;
  font-style: italic;
  font-weight: 700;
}

/* this should contain multiple settings, if there is such a thing */
.settings {
  grid-row: span 20;
}

/* this should be the parent of the labels/inputs */
.settings div {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  line-height: 0.5em;
}

@media screen and (max-width: 600px) {
  .month {
    font-size: 3em;
  }
}

@supports (writing-mode: sideways-lr) {
  .month {
    transform: unset;
    writing-mode: sideways-lr;
  }
}

/**
 * best effort, I guess. Vertical languages should not be rotated. Also, they
 * have a really tall line-height, so enforce 1em so they don't blow up the grid
 */
:is(:lang(zh), :lang(ja), :lang(ko), :lang(mn), :lang(vi)) .month {
  transform: unset;
  writing-mode: unset;
  line-height: 1em;
}
</style>

<script>
import Holidays from "date-holidays";
import day from "./components/day";

function storageAvailable(type) {
  /**
   * See if we have `type` of storage. Yanked from MDN docs:
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#feature-detecting_localstorage
   */
  var storage;
  try {
    storage = window[type];
    var x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      // everything except Firefox
      (e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === "QuotaExceededError" ||
        // Firefox
        e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
  }
}

const holidayExists = (date, holidays) => {
  /**
   * Return first holiday in holidays if any, else falsy
   */
  // return holidays.map((holiday) => holiday.isHoliday(date)).find((v) => v);
  for (let holiday of holidays) {
    const wasHoliday = holiday.isHoliday(date);
    if (wasHoliday) {
      return wasHoliday;
    }
  }
  return false;
};

const compute_cache_key = (date, holidays) => {
  /**
   * Generates a key name for the cache. Naively returns `date-holidays`
   * 2/1/2021-CN,US for example
   */
  return (
    date.toLocaleDateString() + "-" + holidays.map((x) => x.__conf.country)
  );
};

const memoizeHolidayExists = (date, holidays, cache) => {
  /**
   * Memoized version of holidayExists. Cache considered by date + enabled
   * calendars combo
   */
  if (compute_cache_key(date, holidays) in cache) {
    return cache[compute_cache_key(date, holidays)];
  }
  const holidayExisted = holidayExists(date, holidays);
  cache[compute_cache_key(date, holidays)] = holidayExisted;
  return holidayExisted;
};

const getDaysInMonth = () => {
  /**
   * Returns days in this month
   */
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const length = new Date(year, month + 1, 0).getDate(); // save on space
  return new Array(length)
    .fill("")
    .map((_, i) => new Date(year, month, i + 1))
    .filter((v) => v.getMonth() === month);
};

const getDateData = (v, holidays, cache) => {
  /**
   * Generates data to be consumed by day.vue
   */
  const today = new Date();
  // perform this computation once because its expensive.
  const holidayExisted = memoizeHolidayExists(v, holidays, cache);
  return {
    dayOfWeek: v.toLocaleDateString(navigator.languages, {
      weekday: "narrow",
    }),
    isWeekend: v.getDay() === 0 || v.getDay() === 6,
    number: v.getDate(),
    isCurrentDate: v.getDate() === today.getDate(),
    holiday: holidayExisted ? holidayExisted.name : "",
  };
};

const transform_obj_to_reduced_arr = (obj) => {
  /**
   * Transforms {'US': true, 'CN': false} to ['US']
   */
  return Object.keys(obj).reduce(
    (acc, curr) => (obj[curr] ? acc.concat([curr]) : acc),
    []
  );
};

const transform_arr_to_obj = (arr) => {
  /**
   * Transforms ['US'] to {'US': true}
   */
  return arr.reduce((acc, curr) => ((acc[curr] = true), acc), {});
};

export default {
  name: "app",
  components: { day },
  data: () => {
    const today = new Date();
    return {
      // list of calendars to expose to the user to select
      calendars: Object.keys(new Holidays().getCountries()),
      // name of the month, short form, for the top left corner
      month_short: today.toLocaleDateString(navigator.languages, {
        month: "short",
      }),
      selectedCalendars: (function () {
        /**
         * get the selected calendars, or default to "US"
         */
        let cals = ["US"];
        if (
          storageAvailable("localStorage") &&
          localStorage.getItem("calendars") !== null
        ) {
          cals = JSON.parse(localStorage.getItem("calendars"));
        }
        return transform_arr_to_obj(cals);
      })(),
      cache: {},
      theme: window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    };
  },
  computed: {
    dates: function () {
      // the arrow is required to rebind `this` to the Vue object.
      return getDaysInMonth().map((x) =>
        getDateData(x, this.holidays, this.cache)
      );
    },
    language: function () {
      let language = navigator.language;
      // first two letters should be the language: en-US -> en
      return language.length > 2 ? language.substr(0, 2) : language;
    },
    holidays: function () {
      /**
       * Returns an array of Holiday objects with the language + calendar
       */
      // compute holidays (collection of holiday objects)?
      return transform_obj_to_reduced_arr(this.selectedCalendars).map(
        (calendar) => {
          // add holiday object to holiday object array with user lang
          return new Holidays(calendar, {
            languages: this.language,
          });
        }
      );
    },
  },
  watch: {
    selectedCalendars: {
      handler() {
        const true_keys = transform_obj_to_reduced_arr(this.selectedCalendars);
        // save to localStorage
        localStorage.setItem("calendars", JSON.stringify(true_keys));
        // update UI
      },
      deep: true,
    },
    theme: function () {
      document.head
        .querySelector('meta[name="color-scheme"]')
        .setAttribute("content", this.theme);
    },
  },
};
</script>
