<template>
    <div class="word-page">
        <input type="file" ref="input" @change="onchange" @drop.prevent="ondrop">
        <select v-if="sheetList && sheetList.length" v-model="currentSheet">
            <option v-for="sheet in sheetList" :key="sheet.name" :value ="sheet">{{sheet.name}}</option>
        </select>
        <div class="word-area">
            <div class="word-table" v-if="displayedWordList && displayedWordList.length">
                <div class="word-table-row" v-for="(wordObj, index) in displayedWordList" :key="index">
                    <span class="word-table-row-cell cn">{{wordObj.cn || ""}}</span>
                    <span class="word-table-row-cell abbr alph">{{wordObj.abbr || ""}}</span>
                    <input class="input-text alph" type="text" spellcheck="false" @input="oninput($event, index)">
                    <div v-if="correctNumber != null && wordObj.flag" class="row-result">
                        <span class="icon-right">&#10004;</span>
                    </div>
                    <div v-else-if="correctNumber != null && !wordObj.flag" class="row-result">
                        <span class="icon-wrong">&#10008;</span>
                        <span class="row-result-answer alph">{{wordObj.es}}</span>
                    </div>
                </div>
            </div>
            <div class="word-buttons" v-if="displayedWordList && displayedWordList.length">
                <button @click="onclickshuffle">Barajar</button>
                <button @click="onclickclear">Despejar</button>
                <button @click="onclicksubmit">Enviar</button>
                <div v-show="correctNumber != null" class="table-result">
                    <span>{{correctNumber}}</span>/<span style="color: green;">{{displayedWordList.length}}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import XLSX from "xlsx"

export default {
    data() {
        return {
            sheetList: null,
            wordList: null,
            displayedWordList: null,
            correctNumber: null,
            currentSheet: null
        }
    },
    computed: {
        
    },
    methods: {
        checkWord(text = "", es = "") {
            return text.toLowerCase() === es.toLowerCase()
        },
        oninput(e, i) {
            this.displayedWordList[i]["text"] = e.target.value?.trim()
            this.displayedWordList[i]["flag"] = this.checkWord(this.displayedWordList[i].text, this.displayedWordList[i].es)
            this.$set(this.displayedWordList, i, this.displayedWordList[i])
        },
        onchange(e) {
            const files = this.$refs.input?.files
            console.log(files)
            if (!files?.length) return
            this.readFile(files[0])
        },
        ondrop(e) {
            const files = e.dataTransfer.files
            console.log(files)
            if (!files?.length) return
            this.readFile(files[0])

        },
        readFile(file) {
            if (!window.FileReader) {
                setTimeout(() => alert("FileReader not supported by your browser!"), 50)
                return
            }

            // if (!/\.(txt)$/i.test(file.name) || file?.type !== "text/plain") {
            if (!/\.(xlsx)$/i.test(file.name) || file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                setTimeout(() => alert("Invalid file type"), 50)
                return
            }

            const reader = new FileReader();
            // reader.onload = () => {
            //     try {
            //         const content = reader.result
            //         const lines = content.split("\r\n").filter(e => !!e)

            //         const wordList = []
            //         lines.forEach(line => {
            //             let index = -1
            //             for (let i = 0; i < line.length; i++) {
            //                 if (/[\u4e00-\u9fa5]/.test(line.charAt(i))) {
            //                     index = i
            //                     break
            //                 }
            //             }
            //             if (index === -1) return
            //             const cn = line.substring(index).trim()
            //             const es = line.substring(0, index).trim()
            //             if (!cn || !es) return
            //             if (!wordList.some(wordObj => wordObj.cn === cn)) {
            //                 wordList.push({ cn, es })
            //             }
            //         })
            //         console.log(wordList)
            //         if (!wordList.length) {
            //             throw new Error("empty word list")
            //         }
            //         this.wordList = JSON.parse(JSON.stringify(wordList))
            //         wordList.sort(() => Math.random() - 0.5)
            //         this.displayedWordList = wordList
            //     } catch (error) {
            //         console.log(error)
            //         this.wordList = null
            //         this.displayedWordList = null
            //         alert(error.message)
            //     }
            // } 
            // reader.readAsText(file, 'utf8'); 
            reader.onload = () => {
                try {
                    const content = reader.result
                    const workbook = XLSX.read(content, {type: 'binary'})
                    this.sheetList = workbook.SheetNames.map(sheetName => ({
                        name: sheetName,
                        content: workbook.Sheets[sheetName]
                    }))
                    this.currentSheet = this.sheetList[0]
                } catch (error) {
                    console.log(error)
                    alert(error?.message)
                }
            } 
            reader.readAsBinaryString(file);
        },
        onclickclear() {
            if (!this.displayedWordList) return

            const inputs = document.querySelectorAll(".input-text");
            inputs.forEach(input => input.value = "")

            this.displayedWordList.forEach(wordObj => {
                wordObj["text"] = ""
                wordObj["flag"] = this.checkWord(wordObj.text, wordObj.es)
            })
            this.$set(this.displayedWordList, 0, this.displayedWordList[0])

            this.correctNumber = null
        },
        onclicksubmit() {
            if (!this.displayedWordList) return
            
            let number = 0
            this.displayedWordList.forEach(wordObj => {
                wordObj["flag"] = this.checkWord(wordObj.text, wordObj.es)
                if (wordObj["flag"]) {
                    number++
                }
            })
            this.$set(this.displayedWordList, 0, this.displayedWordList[0])

            this.correctNumber = number
        },
        onclickshuffle() {
            this.displayedWordList.sort(() => Math.random() - 0.5)
            this.onclickclear()
        }
    },
    created() {
        document.body.style.overflow = "auto" 
    },
    watch: {
        currentSheet(val) {
            if (!val) return
            try {
                const sheet = val.content
                const wordList = []
                let rowNum = 1
                while (sheet[`A${rowNum}`]) {
                    const es = sheet[`A${rowNum}`]?.v?.trim()
                    const abbr = sheet[`B${rowNum}`]?.v?.trim()
                    const cn = sheet[`C${rowNum}`]?.v?.trim()
                    if (!cn || !es) return
                    if (!wordList.some(wordObj => wordObj.cn === cn && wordObj.es === es)) {
                        wordList.push({ cn, abbr, es })
                    }
                    rowNum++
                }
                console.log(wordList)
                if (!wordList.length) {
                    throw new Error("empty word list")
                }
                this.wordList = JSON.parse(JSON.stringify(wordList))
                wordList.sort(() => Math.random() - 0.5)
                this.displayedWordList = wordList
            } catch (error) {
                console.log(error)
                this.wordList = null
                this.displayedWordList = null
                alert(error?.message)
            }
        }
    }
}
</script>

<style lang="scss">
    .word-page {
        span, input {
            font-size: 16px;
        }

        .alph {
            font-size: 18px;            
        }

        .word-area {
            width: 900px;
            margin: 30px 0 30px 100px;

            .word-table {
                &-row {
                    padding: 10px 20px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;

                    span {
                        display: inline-block;
                    }

                    input {
                        outline: 2px groove rgba(0, 0, 0, 0.2) !important;
                    }

                    .cn {
                        width: 180px;
                    }

                    .abbr {
                        width: 120px;
                    }

                    .row-result {
                        display: inline-block;
                        padding-left: 50px;

                        &-answer {
                            margin-left: 20px;
                            color: red;
                        }
                    }
                }

                &-row:last-of-type {
                    border: none;
                }
            }

            .word-buttons {
                margin-top: 20px;

                button {
                    margin: 0 20px;
                    font-size: 16px;
                    padding: 5px 10px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    border-radius: 6px;
                }

                .table-result {
                    display: inline-block;
                }
            }
        }
        .icon-right {
            color: green;
        }
        .icon-wrong {
            color: red;
        }
    }
</style>