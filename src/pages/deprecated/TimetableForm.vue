<template>
  <form style="font-size: 20px;" action="" ref="form" @submit.prevent>
    <div class="row">
      <label class="row-name"><abbr title="required" aria-label="required">*</abbr>Day:</label>&nbsp;
      <select v-model="day">
        <option v-for="n in 7" :key="n" :value="n">{{n}}</option>
      </select>
    </div>
    <div class="row">
      <label class="row-name"><abbr title="required" aria-label="required">*</abbr>Start Time:</label>&nbsp;
      <select v-model="startTime">
        <option v-for="n in 22" :key="n" :value="9 + (n - 1) * 0.5">{{timeStr(n)}}</option>
      </select>
    </div>
    <div class="row">
      <label class="row-name"><abbr title="required" aria-label="required">*</abbr>Duration(h):</label>&nbsp;
      <select v-model="duration">
        <option v-for="n in 12" :key="n" :value="n * 0.5">{{n * 0.5}}</option>
      </select>
    </div>
    <div class="row"><label class="row-name"><abbr title="required" aria-label="required">*</abbr>Module Code:</label>&nbsp;<input type="text" v-model.trim="moduleCode" placeholder="e.g. EAP111"></div>
    <div class="row"><label class="row-name" for=""><abbr title="required" aria-label="required">*</abbr>Room Name:</label>&nbsp;<input type="text" v-model.trim="roomNo" placeholder="e.g. PB203"></div>
    <div class="row"><label class="row-name">Lesson Type:</label>&nbsp;
      <select v-model="classType">
        <option v-for="cls in classTypeArr" :key="cls" :value="cls">{{cls}}</option>
      </select>-D
      <select style="width: 40px;" v-model="classTime">
        <option v-for="n in 4" :key="n" :value="n">{{n}}</option>
      </select>
      /<input style="width: 40px;" type="text" v-model.trim="classNo">
    </div>
    <div class="row"><label class="row-name">Staff Name:</label>&nbsp;<input type="text" v-model.trim="staffName"></div>
    <div class="row">
      <label class="row-name">Week(Excluded):</label>&nbsp;
      <div style="display: inline-block">
        <span v-for="n in 14" :key="n" style="margin-right: 10px;">
          <input type="checkbox" name="week" :id="`week${n}`" :value="n">&nbsp;<label :for="`week${n}`" style="width: 30px;">{{n}}</label>
          <br v-if="n === 7">
        </span>
      </div>
    </div>
    <!-- <div class="row">
      <label class="row-name" for="">Complete:</label>&nbsp;
      <span style="margin-right: 10px;"><input type="radio" name="complete" id="cy" :value="true">&nbsp;<label for="cy" style="width: 30px;">Yes</label></span>
      <span><input type="radio" name="complete" id="cn" :value="false">&nbsp;<label for="cn" style="width: 30px;">No</label></span>
    </div> -->
    <button style="margin-left: 250px" @click="reset">Reset</button>
    <button @click="getData">Generate Data</button>
  </form>
</template>

<script>
import lessonType from '@/assets/js/lessonType.json'

export default {
  data () {
    return {
      day: null,
      startTime: null,
      duration: null,
      roomNo: null,
      moduleCode: null,
      staffName: null,
      classTypeArr: lessonType.map(type => type["name"].charAt(0).toUpperCase() + type["name"].slice(1)),
      classType: null,
      classTime: null,
      classNo: null
    }
  },
  computed: {
    timeStr () {
      return (n) => {
        const val = (n - 1) * 0.5 + 9
        let str = ''

        if (val % 1 === 0) str += val >= 13 ? val - 12 : val
        else str += val >= 13 ? `${Math.floor(val) - 12}:30` : `${Math.floor(val)}:30`

        if (val >= 12) str += 'pm'
        else str += 'am'
        return str
      }
    }
  },
  methods: {
    reset () {
      this.$refs.form.reset()
      this.day = null
      this.startTime = null
      this.duration = null
      this.roomNo = null
      this.moduleCode = null
      this.staffName = null
      this.classType = null
      this.classTime = null
      this.classNo = null
    },
    getData () {
      if (!this.day || !this.startTime || !this.duration || !this.moduleCode || !this.roomNo) {
        alert('Lacks required data.')
        return
      }

      if (!this.lessonType) this.lessonType = null
      if (!this.staffName) this.staffName = null
      else this.staffName = this.staffName.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())

      const weekElements = document.getElementsByName("week")
      let weekArr = []
      for (let i = 0; i < 14; i++) if (!weekElements[i].checked) weekArr.push(parseInt(weekElements[i].value))
      if (weekArr.length === 14) weekArr = null

      const lessonObj = {
        day: this.day,
        startTime: this.startTime,
        endTime: this.startTime + this.duration,
        moduleCode: this.moduleCode.toUpperCase(),
        roomName: this.roomNo.toUpperCase(),
        type: `${this.classType}-D${this.classTime}/${this.classNo}`,
        staff: this.staffName,
        week: weekArr
      }

      var tag = document.createElement('input');
      tag.setAttribute('id', 'cp_hgz_input');
      tag.value = JSON.stringify(lessonObj)+',';
      document.getElementsByTagName('body')[0].appendChild(tag);
      document.getElementById('cp_hgz_input').select();
      document.execCommand('copy');
      document.getElementById('cp_hgz_input').remove();

      alert('Data successfully added to the clipboard!')
      console.log(JSON.stringify(lessonObj)+',')
    }
  }
}
</script>

<style lang="scss" scoped>
button {
  background-color: #CCC !important;
  border: 1px solid #AAA !important;
}

input, select {
  outline-color: #888 !important;
  border: 1px solid #AAA !important;
}

abbr {
  color: red;
}

form {
  margin: 20px auto;
  width: 700px;
  padding: 1em;
  border: 1px solid #CCC;
  border-radius: 1em;
}

select {
  width: 100px;
}

.row {
  margin: 10px 0;
}

.row-name {
  display: inline-block;
  width: 160px;
  text-align: right;
  margin-bottom: 0px;
}
</style>
