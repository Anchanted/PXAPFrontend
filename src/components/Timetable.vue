<template>
  <table class="frame" border="1" cellpadding="0" cellspacing="0">
    <thead>
      <tr>
        <th></th>
        <template v-if="!selectedBlock">
          <th v-for="day in 7" :key="day" class="week">
            <span>{{$t(`week.abbr.${week[day-1]}`)}}</span>
          </th>
        </template>
        <template v-else>
          <th @click.stop="selectedBlock = null" class="week frame-th-detail" colspan="12">
            <span class="iconfont icon-arrow-down"></span>
            <span>{{$t(`week.full.${week[selectedBlock.col-1]}`)}}</span>
            <span class="iconfont icon-arrow-down"></span>
          </th>
        </template>
      </tr>
    </thead>
    <tbody>
      <tr v-for="i in 24" :key="i" class="frame-tr">
        <td v-if="i % 2 === 1" rowspan="2" class="frame-td row-header"><span>{{((i - 1) / 2 + 9 >= 13 ? (i - 1) / 2 + 9 - 12 : (i - 1) / 2 + 9) + ((i - 1) / 2 + 9 >= 12 ? 'PM' : 'AM')}}</span></td>
        <td v-else style="display:none" class="frame-td"></td>
        <template v-if="!selectedBlock">
          <td v-for="j in 7" :key="`${i >= 10 ? i : '0' + i}${j}`"
            :rowspan="tdRowspan(i, j, 1)"
            :style="tdStyle(i, j, 1)" class="frame-td"
            v-html="tdHTML(i, j, 1)"
            @click="selectBlock(i, j, 1)"></td>
        </template>
        <template v-else>
          <td v-for="k in 12" :key="`${i >= 10 ? i : '0' + i}${k}`"
            :rowspan="tdRowspan(i, selectedBlock.col, k)" :colspan="tdColspan(i, selectedBlock.col, k)"
            :style="tdStyle(i, selectedBlock.col, k)" class="frame-td frame-td-detail"
            v-html="tdHTML(i, selectedBlock.col, k)"
            @click="selectBlock(i, selectedBlock.col, k)">
          </td>
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script>
import lessonType from 'assets/json/lessonType.json'

export default {
  props: {
    lessons: {
      type: Array,
      required: true,
      default: () => []
    },
  },
  data () {
    return {
      lessonList: [],
      blockList: [],
      selectedBlock: null,
      week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    }
  },
  computed: {
    tdRowspan () {
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
    tdColspan () {
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
        const block = this.blockList.find(block => block.startRow <= i && block.endRow > i && block.day === j)
        if (block) {
          if (!this.selectedBlock || !(this.selectedBlock.row === block.startRow && this.selectedBlock.col === block.day)) {
            if (i === block.startRow && k === 1) {
              const lessonList = block.lessonList || []
              let color = null
              if (lessonList.length === 1) {
                if (lessonList[0]["name"]) {
                  const type = lessonType.find(type => lessonList[0]["name"].toLowerCase().indexOf(type["name"]) === 0)
                  if (type) color = type["color"]
                }
              } else if (lessonList.length > 1) color = "#ff8040"
              return {
                "background-color": color,
                "cursor": "pointer"
              }
            }
            return { "display": 'none' }
          } else {
            const lessonList = block.lessonList || []
            const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 <= i - 1 && (lesson["endTime"] - 9) * 2 > i - 1 && lesson["startCol"] <= k && lesson["startCol"] + lesson["span"] > k)
            if (lesson) {
              if ((lesson["startTime"] - 9) * 2 === i - 1 && lesson["startCol"] === k) {
                let color = null
                if (lesson["name"]) {
                  const type = lessonType.find(type => lesson["name"].toLowerCase().indexOf(type["name"]) === 0)
                  if (type) color = type["color"]
                }
                return {
                  "border": '2px solid #EAEAEA',
                  "background-color": color,
                }
              }
              return { "display": 'none' }
            }
          }
        }
        return null
      }
    },
    tdHTML () {
      return (i, j, k) => {
        const block = this.blockList.find(block => block.startRow <= i && block.endRow > i && block.day === j)
        if (block) {
          if (!this.selectedBlock || !(this.selectedBlock.row === block.startRow && this.selectedBlock.col === block.day)) {
            if (i === block.startRow && k === 1) {
              const lessonList = block.lessonList || []
              if (lessonList.length === 0) return '0'
              else if (lessonList.length === 1) {
                const lesson = lessonList[0]
                let moduleCode = lesson["moduleCode"]
                if (!moduleCode.includes(' ') && !moduleCode.includes('-')) moduleCode = `${moduleCode.slice(0,3)}${this.selectedBlock ? "" : "<br/>"}${moduleCode.slice(3)}`
                return moduleCode
              } else return '· · ·'
            }
          } else {
            const lessonList = block.lessonList || []
            const lesson = lessonList.find(lesson => (lesson["startTime"] - 9) * 2 === i - 1 && lesson["startCol"] === k)
            if (lesson) {
              // let weekArr = ''
              // if (lesson.week) lesson.week.forEach((week, index) => weekArr += week + (index < lesson.week.length - 1 ? ',' : ''))
              // const weekArr = lesson.week
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
                      <td>Week: ${this.calculateWeeks(lesson.week?.join(','))}</td>
                    </tr>
                  </tbody>
                </table>`
            }
          }
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
      if (!!block && (!this.selectedBlock || !(this.selectedBlock.row === block.startRow && this.selectedBlock.col === block.day))) {
        this.selectedBlock = {
          row: block.startRow,
          col: block.day
        }
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

  mounted () {
    this.lessonList = this.lessons

    for (let day = 1; day <= 7; day++) {
      const dailyLessonList = []
      this.lessonList.forEach(lesson => {
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

<style lang='scss'>
.frame {
  border: 2px solid #EAEAEA;

  table {
    border-collapse: collapse;
    table-layout: fixed;
    // width: 1400px;
    background-color: transparent;
  }

  th {
    border: 2px solid #EAEAEA;
    color: #666;
    height: 35px;
    text-align: center;
  }

  td {
    border: 2px solid #EAEAEA;
    height: 40px;
  }

  span {
    display: inline-block;
  }

  .week {
    width: 1000px;
  }

  .frame-th-detail {
    cursor: pointer;
    position: relative;

    :first-child {
      position: absolute;
      left: 0;
      margin-left: 8px;
      transform: rotate(-90deg);
      // font-size: 3.5vw;
      animation: l2r 1s linear infinite normal;
      // -moz-animation: l2r 1s infinite alternate;	/* Firefox */
      // -webkit-animation: l2r 1s infinite alternate;	/* Safari 和 Chrome */
      // -o-animation: l2r 1s infinite alternate;	/* Opera */
    }

    :last-child {
      position: absolute;
      right: 0;
      margin-right: 8px;
      transform: rotate(90deg);
      // font-size: 3.5vw;
      animation: r2l 1s linear infinite normal;
    }
  }

  .row-header {
    padding: 0 5px;
    // width: 50px;
    height: 80px;
  }

  .frame-td {
    color: #666;
    // width: 100px;
    text-align: center;
    // padding: 0 10px;
    position: relative;

    .lesson {
      margin: 0 auto;
    }

    .lesson td{
      border: none !important;
      width: 150px;
      text-align: center;
      padding: 5px 10px;
    }
  }

  .frame-td:first-child {
    border-left: 2px solid #EAEAEA;
    border-right: 2px solid #EAEAEA;
  }

  .frame-td:nth-child(12n+2) {
    border-left: 2px solid #EAEAEA;
  }

  .frame-td:nth-child(12n+13) {
    border-right: 2px solid #EAEAEA;
  }

  .frame-td-detail {
    border-left: none;
    border-right: none;
  }
}

.nonemptycell {
  padding: 0 10px;
}

@keyframes l2r
{
  0% {left: 0;}
  35% {left: 10px;}
  70% {left: 0;}
  100% {left: 0;}
}

@keyframes r2l
{
  0% {right: 0;}
  35% {right: 10px;}
  70% {right: 0;}
  100% {right: 0;}
}
</style>
