<template>
  <table class="frame" border="1" cellpadding="0" cellspacing="0">
    <thead>
      <tr>
        <th></th>
        <th v-for="day in 7" :key="day"
        class="week-th"
        :colspan="thColspan(day)"
        :style="thStyle(day)"
        @click.stop="selectedBlock = null">
          <span>{{$t(`week.${selectedBlock ? "full" : "abbr"}.${week[day-1]}`)}}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="i in 24" :key="i" class="frame-tr">
        <td v-if="i % 2 === 1" rowspan="2" class="frame-td row-header">{{((i - 1) / 2 + 9 >= 13 ? (i - 1) / 2 + 9 - 12 : (i - 1) / 2 + 9) + ((i - 1) / 2 + 9 >= 12 ? 'PM' : 'AM')}}</td>
        <td v-else style="display:none" class="frame-td"></td>
        <template v-for="j in 7">
          <td v-for="k in 12" :key="`${j}${k >= 10 ? k : '0' + k}`"
            :rowspan="tdBlockRowspan(i, j, k)" :colspan="tdBlockColspan(i, j, k)"
            :style="tdStyle(i, j, k)" class="frame-td"
            v-html="tdLessonTable(i, j, k)"
            @click="selectBlock(i, j, k)">
            <!-- <table class="lesson" v-html="tdLessonTable(i, j, k)"></table>
            <div v-if="selectedBlock && selectedBlock.row === i && selectedBlock.col === j && k === 1"
              class="iconfont icon-close close"
              @click.stop="selectedBlock = null"></div> -->
          </td>
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script>
// import lessonList from '@/assets/json/roomlesson'

export default {
  data () {
    return {
      lessonMetrix: new Array(7),
      blockList: [],
      selectedBlock: null,
      week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    }
  },
  computed: {
    thColspan () {
      return (day) => {
        return (!this.selectedBlock || this.selectedBlock.col !== day) ? 12 : 12
      }
    },
    thStyle () {
      return (day) => {
        return (this.selectedBlock && this.selectedBlock.col !== day) ? { "display": 'none' } : null
      }
    },
    tdBlockRowspan () {
      return (i, j, k) => {
        const block = this.blockList.find(block => block.startRow <= i && block.endRow > i && block.day === j)
        if (block) {
          if (!this.selectedBlock || !(this.selectedBlock.row === block.startRow && this.selectedBlock.col === block.day)) {
            if (i === block.startRow && k === 1) return block.endRow - block.startRow
          } else {
            const lessonList = block.lessonList || []
            const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 === i - 1 && lesson["startCol"] === k)
            if (lesson) return (lesson["endTime"] - lesson["startTime"]) * 2
          }
        }
        return 1
      }
    },
    tdBlockColspan () {
      return (i, j, k) => {
        const block = this.blockList.find(block => block.startRow <= i && block.endRow > i && block.day === j)
        if (block) {
          if (!this.selectedBlock || !(this.selectedBlock.row === block.startRow && this.selectedBlock.col === block.day)) {
            if (i === block.startRow && k === 1) return 12
          } else {
            const lessonList = block.lessonList || []
            const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 === i - 1 && lesson["startCol"] === k)
            if (lesson) return lesson["span"]
          }
        }
        return 1
      }
    },
    tdStyle () {
      return (i, j, k) => {
        if (this.selectedBlock && this.selectedBlock.col !== j) return { "display": 'none' }
        const block = this.blockList.find(block => block.day === j && block.startRow <= i && block.endRow > i)
        if (block) {
          if (!this.selectedBlock || !(this.selectedBlock.row === block.startRow && this.selectedBlock.col === block.day)) {
            if (block.startRow < i || k > 1) return { "display": 'none' }
          } else {
            const lessonList = block.lessonList || []
            const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 <= i - 1 && (lesson["endTime"] - 9) * 2 > i - 1 && lesson["startCol"] <= k && lesson["startCol"] + lesson["span"] > k)
            if (lesson) return (lesson["startTime"] - 9) * 2 === i - 1 && lesson["startCol"] === k ? { "border": '2px solid #000' } : { "display": 'none' }
          }
        }
        return null
      }
    },
    tdLessonTable () {
      return (i, j, k) => {
        const block = this.blockList.find(block => block.startRow <= i && block.endRow > i && block.day === j)
        if (block) {
          if (!this.selectedBlock || !(this.selectedBlock.row === block.startRow && this.selectedBlock.col === block.day)) {
            if (i === block.startRow && k === 1) {
              const lessonList = block.lessonList || []
              if (lessonList.length === 0) return '0'
              else if (lessonList.length === 1) return lessonList[0]["moduleCode"]
              else return '· · ·'
            }
          } else {
            const lessonList = block.lessonList || []
            const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 === i - 1 && lesson["startCol"] === k)
            if (lesson) {
              // let weekArr = ''
              // if (lesson.week) lesson.week.forEach((week, index) => weekArr += week + (index < lesson.week.length - 1 ? ',' : ''))
              return `
                      <table class="lesson">
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
                            <td>Week: ${this.calculateWeeks(lesson.week)}</td>
                          </tr>
                        </tbody>
                      </table>`
            }
          }
        }
        return
      }
    },
    findLesson () {
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
    selectBlock (i, j, k) {
      const block = this.blockList.find(block => block.day === j && block.startRow <= i && block.endRow > i)
      // console.log(!!block, !this.selectedBlock, this.selectedBlock ? `${this.selectedBlock.row} ${this.selectedBlock.col}` : null, i, j, this.selectedBlock && block ? !(this.selectedBlock.row === block.startRow && this.selectedBlock.col === block.day) : null)
      if (!!block && (!this.selectedBlock || !(this.selectedBlock.row === block.startRow && this.selectedBlock.col === block.day))) {
        console.log('valid')
        this.selectedBlock = {
          row: block.startRow,
          col: block.day
        }
      } else {
        console.log('invalid')
      }
    },
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

  async mounted () {
    // lessonList.forEach(lesson => {
    //   if (lesson["endTime"] <= lesson["startTime"]) {
    //     console.error("time error")
    //     alert("time error")
    //   }
    //   lesson["duration"] = lesson["endTime"] - lesson["startTime"]
    // })
    const data = await this.$api.room.getRoomInfo(6)
    console.log(data)
    const lessonList = data.timetable

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

        console.log((lesson["startTime"] - 9) * 2, lesson["startCol"])
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
  transition: all 0.5s;
  border: 2px solid #000;
}

.frame-td:first-child {
  border-left: 2px solid #000;
  border-right: 2px solid #000;
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
  width: 100px;
  text-align: center;
  // padding: 0 10px;
  position: relative;
}

.nonemptycell {
  padding: 0 10px;
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

.week-th {
  // width: 1000px;
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
  height: 80px;
}

.close {
  position: absolute;
  left: 10px;
  top: 5px;
  background: #E6E3DF;
  color: #8E8E93;
  font-size: 15px;
  height: 30px;
  width: 30px;
  line-height: 30px;
  text-align: center;
  vertical-align: middle;
  border-radius: 15px;
  z-index: 3001;
}
</style>
