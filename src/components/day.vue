<template>
  <p class="holiday" :class="{ currentDate: isCurrentDate }">{{ holiday }}</p>
  <p
    :class="{ weekend: isWeekend }"
    class="number"
    :style="{ 'grid-row': number }"
  >
    {{ number }}
  </p>
  <div class="divider"></div>
  <p
    :class="{ weekend: isWeekend, currentDate: isCurrentDate }"
    class="dateEntry day"
  >
    {{ dayOfWeek }}
  </p>
</template>

<style scoped>
p {
  margin: 0;
  text-align: center;
  align-self: center;
}
.divider {
  grid-column: divider;
  background-color: var(--foreground_reduced);
}
.currentDate {
  background-color: var(--highlight);
}
.holiday {
  grid-column: holiday;
  text-align: left;
  color: var(--foreground_reduced);
  padding: 0 4px;
  /* guarantee one line */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.number {
  text-align: right;
  grid-column: weekday;
}
.number.weekend {
  text-align: left;
  grid-column: weekend;
}
.dateEntry {
  grid-column: day;
}
.weekend {
  color: var(--foreground_reduced);
}

@media screen and (max-width: 600px) {
  .holiday {
    font-size: 0.8em;
  }
}
</style>

<script>
export default {
  name: "day",
  props: {
    dayOfWeek: {
      type: String,
    },
    isWeekend: {
      type: Boolean,
    },
    number: {
      type: Number,
    },
    isCurrentDate: {
      type: Boolean,
    },
    holiday: {
      type: String,
    },
  },
};
</script>
