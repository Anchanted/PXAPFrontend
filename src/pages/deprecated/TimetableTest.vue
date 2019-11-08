<template>
  <div>
    <table class="frame" border="1" cellpadding="0" cellspacing="0">
      <thead>
        <tr>
          <th></th>
          <th><span>Mon</span></th>
          <th><span>Tue</span></th>
          <th><span>Wed</span></th>
          <th><span>Thu</span></th>
          <th><span>Fri</span></th>
          <th><span>Sat</span></th>
          <th><span>Sun</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in 24" :key="i">
          <td v-if="i % 2 === 1" rowspan="2" class="frame-td row-header">{{((i - 1) / 2 + 9 >= 13 ? (i - 1) / 2 + 9 - 12 : (i - 1) / 2 + 9) + ((i - 1) / 2 + 9 >= 12 ? 'PM' : 'AM')}}</td>
          <td v-else style="display:none" class="frame-td"></td>
          <template v-for="j in 7">
            <td :key="j" :rowspan="tdBlockRowspan(i, j)" :colspan="tdBlockColspan(i, j)" :style="tdStyle(i, j)" class="frame-td">
              <table v-if="blockList.find(block => block.col === j && block.startRow === i)" style="width: 100%; height: 100%;">
                <tbody>
                  <tr v-for="m in tdBlockRowspan(i, j)" :key="m">
                    <td v-for="n in 12" :key="n" :rowspan="tdLessonRowspan(i, j, m, n)" :colspan="tdLessonColspan(i, j, m, n)" class="grid-td" :style="tdInfoGridStyle(i, j, m, n)" v-html="tdLessonTable(i, j, m, n)">
                    <!-- <td v-for="n in 12" :key="n" :rowspan="tdLessonRowspan(i, j, m, n)" :colspan="tdLessonColspan(i, j, m, n)" class="grid-td" :style="tdInfoGridStyle(m)"> -->

                    </td>
                  </tr>
                </tbody>
              </table>
              <!-- {{tdText(i, j)}} -->
            </td>
          </template>
        </tr>
      </tbody>
    </table>
    <!-- <table class="grid" border="1" cellpadding="0" cellspacing="0" style="position: absolute; top: 0;">
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
    </table> -->
  </div>
</template>

<script>
import lessonList from '@/assets/js/roomlesson'

export default {
  data () {
    return {
      lessonMetrix: new Array(7),
      blockList: []
    }
  },
  computed: {
    tdBlockRowspan () {
      return (row, col) => {
        const block = this.blockList.find(block => block.col === col && block.startRow === row)
        if (block) return block.endRow - block.startRow
        return 1
      }
    },
    tdBlockColspan () {
      return (row, col) => {
        return 1
      }
    },
    tdStyle () {
      return (row, col) => {
        const block = this.blockList.find(block => block.col === col && block.startRow < row && block.endRow > row)
        if (block) return { display: 'none' }
        return null
      }
    },
    tdText () {
      return (row, col) => {
        const block = this.blockList.find(block => block.col === col && block.startRow === row)
        if (block) {
          if (block.lessonList.length === 1) {
            return block.lessonList[0]["moduleCode"]
          } else if (block.lessonList.length > 1) {
            return '· · ·'
          }
        }
      }
    },
    tdInfoGridStyle () {
      return (i, j, m, n) => {
        let styleObj = {
          "border-top": m > 1 ? '2px solid #000' :'none',
          "border-bottom": m < 12 ? '2px solid #000' :'none'
        }
        if (!this.findLessonGrid(i, j, m, n)) {
          const block = this.blockList.find(block => block.col === j && block.startRow <= i && block.endRow > i)
          if (block) {
            const lessonList = block.lessonList || []
            const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 <= i + m - 2 && (lesson["endTime"] - 9) * 2 > i + m - 2 && lesson["startCol"] <= n && lesson["startCol"] + lesson["span"] > n)
            if (lesson) styleObj = {
              ...styleObj,
              "display": 'none'
            }
          }
        } else {
          styleObj = {
            ...styleObj,
            "background": 'RGB(170,170,255)'
          }
        }
        return styleObj
      }
    },
    // tdInfoGridStyle () {
    //   return (m) => {
    //     return {
    //       "border-top": m > 1 ? '2px solid #000' :'none',
    //       "border-bottom": m < 12 ? '2px solid #000' :'none'
    //     }
    //   }
    // },
    tdLessonRowspan () {
      return (i, j, m, n) => {
        const lesson = this.findLessonGrid(i, j, m, n)
        if (lesson)  return lesson["duration"] * 2
        else return 1
      }
    },
    tdLessonColspan () {
      return (i, j, m, n) => {
        const lesson = this.findLessonGrid(i, j, m, n)
        if (lesson) return lesson["span"]
        else return 1
      }
    },
    findLessonGrid () {
      return (i, j, m, n) => {
        const block = this.blockList.find(block => block.col === j && block.startRow === i)
        if (block) {
          const lessonList = block.lessonList || []
          const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 === i + m - 2 && lesson["startCol"] === n)
          return lesson
        }
        return
      }
    },
    tdLessonTable () {
      return (i, j, m, n) => {
        const lesson = this.findLessonGrid(i, j, m, n)
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
                        <td>${this.calculateWeeks(weekArr)}</td>
                      </tr>
                    </tbody>
                  </table>`
        }
        return ''

      }
    },
    itemStyle () {
      return (lesson) => {
        return {
          'grid-column-start': `span ${lesson["span"]}`,
          'grid-row': `${(lesson["startTime"] - 9) * 2 + 1} / span ${lesson["duration"] * 2}`
        }
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
    lessonList.forEach(lesson => {
      if (lesson["endTime"] <= lesson["startTime"]) {
        console.error("time error")
        alert("time error")
      }
      lesson["duration"] = lesson["endTime"] - lesson["startTime"]
    })

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
            col: day,
            startRow,
            endRow,
            lessonList: [lesson]
          })
        } else { // blockList already has elements
          const lastIndex = this.blockList.length - 1
          if (this.blockList[lastIndex].col != lesson["day"] || startRow >= this.blockList[lastIndex].endRow || lesson["span"] === 12) { // add a new block
            this.blockList.push({
              col: day,
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

<style lang='scss'>
table {
  border-collapse: collapse;
  // text-align: center;
  table-layout: fixed;
  // width: 1400px;
  background-color: transparent;
}

.frame {
  z-index: 100;
}

.grid {
  z-index: 1;
}

.frame-td {
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
}

.lesson td{
  border: none !important;
  width: 150px;
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

.row-header {
  padding: 0 10px;
}
</style>
