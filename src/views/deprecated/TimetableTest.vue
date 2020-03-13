<template>
  <table class="frame" border="1" cellpadding="0" cellspacing="0">
    <thead>
      <tr>
        <th></th>
        <th colspan="12"><span>Mon</span></th>
        <th colspan="12"><span>Tue</span></th>
        <th colspan="12"><span>Wed</span></th>
        <th colspan="12"><span>Thu</span></th>
        <th colspan="12"><span>Fri</span></th>
        <th colspan="12"><span>Sat</span></th>
        <th colspan="12"><span>Sun</span></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="i in 24" :key="i" class="frame-tr">
        <td v-if="i % 2 === 1" rowspan="2" class="frame-td row-header">{{((i - 1) / 2 + 9 >= 13 ? (i - 1) / 2 + 9 - 12 : (i - 1) / 2 + 9) + ((i - 1) / 2 + 9 >= 12 ? 'PM' : 'AM')}}</td>
        <td v-else style="display:none" class="frame-td"></td>
        <template v-for="j in 7">
          <td v-for="k in 12" :key="`${j}${k >= 10 ? k : '0' + k}`" :rowspan="tdBlockRowspan(i, j, k)" :colspan="tdBlockColspan(i, j, k)" :style="tdStyle(i, j, k)" class="frame-td" v-html="tdLessonTable(i, j, k)">

          </td>
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script>
import lessonList from '@/assets/json/roomlesson'

export default {
  data () {
    return {
      lessonMetrix: new Array(7),
      blockList: []
    }
  },
  computed: {
    // tdBlockRowspan () {
    //   return (row, day, col) => {
    //     const block = this.blockList.find(block => block.day === day && block.startRow === row)
    //     return (block && col === 1) ? block.endRow - block.startRow : 1
    //   }
    // },
    // tdBlockColspan () {
    //   return (row, day, col) => {
    //     const block = this.blockList.find(block => block.day === day && block.startRow === row)
    //     return (block && col === 1) ? 12 : 1
    //   }
    // },
    // tdStyle () {
    //   return (row, day, col) => {
    //     const block = this.blockList.find(block => block.day === day && block.startRow <= row && block.endRow > row)
    //     if (block)
    //       if (block.startRow < row || col > 1)
    //         return { display: 'none' }
    //     return null
    //   }
    // },
    tdBlockRowspan () {
      return (row, day, col) => {
        const lesson = this.findLessonGrid(row, day, col)
        return lesson ? (lesson["endTime"] - lesson["startTime"]) * 2 : 1
      }
    },
    tdBlockColspan () {
      return (row, day, col) => {
        const lesson = this.findLessonGrid(row, day, col)
        return lesson ? lesson["span"] : 1
      }
    },
    tdStyle () {
      return (i, j, k) => {
        if (!this.findLessonGrid(i, j, k)) {
          const block = this.blockList.find(block => block.day === j && block.startRow <= i && block.endRow > i)
          if (block) {
            const lessonList = block.lessonList || []
            const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 <= i - 1 && (lesson["endTime"] - 9) * 2 > i - 1 && lesson["startCol"] <= k && lesson["startCol"] + lesson["span"] > k)
            if (lesson) return { "display": 'none' }
          }
          return null
        }
        return { "border": '2px solid #000' }
      }
    },
    findLessonGrid () {
      return (i, j, k) => {
        const block = this.blockList.find(block => block.day === j && block.startRow === i)
        if (block) {
          const lessonList = block.lessonList || []
          const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 === i - 1 && lesson["startCol"] === k)
          return lesson
        }
        return
      }
    },
    tdLessonTable () {
      return (i, j, k) => {
        const lesson = this.findLessonGrid(i, j, k)
        if (lesson) {
          let weekArr = ''
          if (lesson.week) lesson.week.forEach((week, index) => weekArr += week + (index < lesson.week.length - 1 ? ',' : ''))
          return `<table class="lesson">
                    <tbody>
                      <tr>
                        <td>${lesson.moduleCode}</td>
                      </tr>
                      <tr>
                        <td>${lesson.type}</td>
                      </tr>
                      <tr>
                        <td>${lesson.staff}</td>
                      </tr>
                      <tr>
                        <td>Week: ${this.calculateWeeks(weekArr)}</td>
                      </tr>
                    </tbody>
                  </table>`
        }
        return

      }
    },
    calculateWeeks () {
      return (weekStr) => {
        const totalWeek = 14
        if (weekStr) {
          const weekArr = weekStr.split(',').map(i => parseInt(i))
          weekArr.sort((a,b) => a-b)

          let newWeekStr = ''
          let startWeekNum
          for (let i = 0; i < weekArr.length; i++) {
            if (i === 0) {
              startWeekNum = weekArr[i]
              newWeekStr += startWeekNum
            } else {
              if (weekArr[i] - weekArr[i-1] > 1 || weekArr[i-1] === 4) {
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
    },
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

  mounted () {
    // lessonList.forEach(lesson => {
    //   if (lesson["endTime"] <= lesson["startTime"]) {
    //     console.error("time error")
    //     alert("time error")
    //   }
    //   lesson["duration"] = lesson["endTime"] - lesson["startTime"]
    // })

    for (let day = 1; day <= 7; day++) {
      const dailyLessonList = []
      lessonList.forEach(lesson => {
        if (lesson["day"] === day) dailyLessonList.push(lesson)
      })
      dailyLessonList.sort(this.compare())

      const timeList = Array.apply(null,{length:24}).map(()=>0)
      dailyLessonList.forEach(lesson => {
        const startIndex = (lesson["startTime"] - 9) * 2
        const endIndex = (lesson["endTime"] - 9) * 2
        for (let i = startIndex; i < endIndex; i++) timeList[i]++
      })

      dailyLessonList.forEach(lesson => {
        const startRow = (lesson["startTime"] - 9) * 2 + 1
        const endRow = (lesson["endTime"] - 9) * 2 + 1

        const count = Math.max.apply(null, timeList.slice(startRow - 1, endRow - 1))
        if (count > 4) {
          console.error("count more than 4")
          alert("count more than 4")
        }
        lesson["span"] = 12 / count

        if (this.blockList.length === 0) { // no block in blockList, add a new block
          this.blockList.push({
            day,
            startRow,
            endRow,
            lessonList: [lesson]
          })
        } else { // blockList already has elements
          const lastIndex = this.blockList.length - 1
          if (this.blockList[lastIndex].day != lesson["day"] || startRow >= this.blockList[lastIndex].endRow || lesson["span"] === 12) { // add a new block
            this.blockList.push({
              day,
              startRow,
              endRow,
              lessonList: [lesson]
            })
          } else { // add current lesson to the last block
            this.blockList[lastIndex].lessonList.push(lesson)
            if (this.blockList[lastIndex].endRow < endRow) this.blockList[lastIndex].endRow = endRow
          }
        }

      })
    }

    this.blockList.forEach(block => {
      const lessonList = block.lessonList || []
      const colList = Array.apply(null,{length:(block.endRow - block.startRow)}).map(()=>0)
      lessonList.forEach(lesson => {
        const startIndex = (lesson["startTime"] - 9) * 2 + 1 - block.startRow
        const endIndex = (lesson["endTime"] - 9) * 2 + 1 - block.startRow

        lesson["startCol"] = Math.max.apply(null, colList.slice(startIndex, endIndex)) + 1
        for (let i = startIndex; i < endIndex; i++) colList[i] += lesson["span"]
      })
    })

    console.log(this.blockList)
  }
}
</script>

<style lang='scss' scoped>
table {
  border-collapse: collapse;
  // text-align: center;
  table-layout: fixed;
  // width: 1400px;
  background-color: transparent;
}

td {
  border: 2px solid #000;
  border-left: none;
  border-right: none;
}

.frame {
  z-index: 100;
}

.grid {
  z-index: 1;
}

.frame-td:nth-child(12n+2) {
  border-left: 2px solid #000;
}

.frame-td:nth-child(12n+13) {
  border-right: 2px solid #000;
}

.frame-td {
  color: #666;
  height: 40px;
  width: auto;
  padding: 0 10px;
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
  text-align: center;

  span {
    display: inline-block;
    width: 80px;
  }
}

.grid-td {
  border: none;
}

.lesson {
  // background:red;
  margin: 0 auto;
}

.lesson td{
  border: none !important;
  width: 150px;
  text-align: center;
  padding: 5px 10px;
}

.row-header {
  padding: 0 10px;
}
</style>
