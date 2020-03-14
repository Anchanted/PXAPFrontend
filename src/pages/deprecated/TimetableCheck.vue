<template>
  <div>
    <table class="frame" border="1" cellpadding="0" cellspacing="0">
      <thead>
        <tr>
          <th></th>
          <th>Monday</th>
          <th>Tuesday</th>
          <th>Wednesday</th>
          <th>Thursday</th>
          <th>Friday</th>
          <th>Saturday</th>
          <th>Sunday</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="i in 12">
          <tr :key="i + '1'">
            <td rowspan="2">{{(i + 8 >= 13 ? i + 8 - 12 : i + 8) + (i + 8 >= 12 ? 'PM' : 'AM')}}</td>
            <td v-for="j in 7" :key="j"></td>
          </tr>
          <tr :key="i + '2'">
            <td style="display:none"></td>
            <td v-for="j in 7" :key="j"></td>
          </tr>
        </template>
      </tbody>
    </table>
    <table class="grid" border="1" cellpadding="0" cellspacing="0" style="position: absolute; top: 0;">
      <thead>
        <tr>
          <th></th>
          <th v-for="i in 7" :key="i"></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td></td>
          <td v-for="(day, i) in lessonMetrix" :key="i" style="">
            <div class="grid-container">
              <div v-for="(lesson, j) in day" :key="j" class="item" :style="itemStyle(lesson)">
                {{lesson["moduleCode"]}}<br>
                {{lesson["type"]}}<br>
                {{lesson["roomName"]}}<br>
                {{calculateWeeks(lesson["week"])}}
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import lessonList from '@/assets/js/roomlesson'

export default {
  data () {
    return {
      lessonMetrix: new Array(7)
    }
  },
  computed: {
    itemStyle () {
      return (lesson) => {
        return {
          'grid-column-start': `span ${lesson["span"]}`,
          'grid-row': `${(lesson["startTime"] - 9) * 2 + 1} / span ${lesson["duration"] * 2}`
        }
      }
    },
    calculateWeeks () {
      return (weekArr) => {
        const totalWeek = 14
        if (weekArr) {
          let newWeekStr = ''
          let startWeekNum
          for (let i = 0; i < weekArr.length; i++) {
            if (i === 0) {
              startWeekNum = weekArr[i]
              newWeekStr += startWeekNum
            } else {
              if (weekArr[i] - weekArr[i-1] > 1) {
                if (weekArr[i-1] !== startWeekNum) newWeekStr += '-' + weekArr[i-1]
                newWeekStr += ', '
                startWeekNum = weekArr[i]
                newWeekStr += startWeekNum
              } else if (i === weekArr.length - 1) newWeekStr += '-' + weekArr[i]
            }
          }
          return newWeekStr
        }
      }
    }
  },
  methods: {
    compare () {
      return function (obj1, obj2) {
        var val1 = obj1["startTime"];
        var val2 = obj2["startTime"];
        //如果值为空的，放在最后
        if (val1 == null && val2 == null) {
          return 0;
        } else if (val1 == null && val2!= null ) {
          return 2
        } else if (val2 == null && val1!= null ) {
          return -2
        }
        //排序
        if (val1 < val2) {
          return -2
        } else if (val1 > val2) {
          return 2
        } else {
          val1 = obj1["duration"];
          val2 = obj2["duration"];

          if (val1 < val2) {
            return 1
          } else if (val1 > val2) {
            return -1
          } else {
            return 0;
          }
        }
      }
    }
  },

  created () {
    lessonList.forEach(lesson => {
      if (lesson["endTime"] <= lesson["startTime"]) {
        console.error("time error")
        alert("time error")
      }
      lesson["duration"] = lesson["endTime"] - lesson["startTime"]
    })

    for (let i = 0; i < 7; i++) {
      this.lessonMetrix[i] = new Array()

      lessonList.forEach(lesson => {
        if (lesson["day"] === i + 1) this.lessonMetrix[i].push(lesson)
      })

      this.lessonMetrix[i].sort(this.compare())

      const timeList = Array.apply(null,{length:24}).map(()=>0)

      this.lessonMetrix[i].forEach(lesson => {
        const startIndex = (lesson["startTime"] - 9) * 2
        const endIndex = (lesson["endTime"] - 9) * 2

        for (let i = startIndex; i < endIndex; i++) timeList[i]++
      })

      this.lessonMetrix[i].forEach(lesson => {
        const startIndex = (lesson["startTime"] - 9) * 2
        const endIndex = (lesson["endTime"] - 9) * 2

        const count = Math.max.apply(null, timeList.slice(startIndex, endIndex))
        if (count > 4) {
          console.error("count more than 4")
          alert("count more than 4")
        }
        lesson["span"] = 12 / count
      })
    }

    console.log(this.lessonMetrix)

  }
}
</script>

<style lang='scss'>
table {
  border-collapse: collapse;
  // text-align: center;
  table-layout: fixed;
  /* width: 700px; */
  width: 1400px;
  background-color: transparent;
}

.frame {
  z-index: 100;
}

.grid {
  z-index: 1;
}

.frame td {
  border: 2px solid #000;
  color: #666;
  height: 40px;
  width: auto;
}

.grid td{
  border: 2px solid transparent;
  width: auto;
  // height: 960px;
}

table thead th {
  border: 2px solid #000;
  color: #666;
  height: 50px;
  width: 50px;
  text-align: center;
}

.grid-container {
  width: 100%;
  height: 950px;
  // background-color: #aaa;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(24, 1fr);

}

.item {
  background: #aaa;
  margin: 2px;
  padding: 2px;
  border-radius: 10px;
  border: 2px solid black;
  // font-size: 18px;
}
</style>
