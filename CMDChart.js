"use strict"

exports.CMDChart = class CMDChart {

    static plot (data, {title, rows=15, colours={}, animation=0}={}) {

        // Colours Start
        const cData = {
            foreground: {
                black: "\x1b[30m",
                red: "\x1b[31m",
                green: "\x1b[32m",
                yellow: "\x1b[33m",
                blue: "\x1b[34m",
                magenta: "\x1b[35m",
                cyan: "\x1b[36m",
                white: "\x1b[37m"
            },
            background: {
                black: "\x1b[40m",
                red: "\x1b[41m",
                green: "\x1b[42m",
                yellow: "\x1b[43m",
                blue: "\x1b[44m",
                magenta: "\x1b[45m",
                cyan: "\x1b[46m",
                white: "\x1b[47m"
            }
        }

        let barC = colours.bars ? cData.foreground[colours.bars] : cData.foreground.white
        let cbgC = colours.chartBackground ? cData.background[colours.chartBackground] : ""
        let keyC = colours.keys ? cData.foreground[colours.keys] : ""
        let axisC = colours.axis ? cData.foreground[colours.axis] : cData.foreground.white
        this.axisC = axisC // For outside scope use
        let titleC = colours.title ? cData.foreground[colours.title] : ""

        // Reset
        const reset = "\x1b[0m"
        let barR = axisC ? axisC : reset
        let axisR = barC ? barC : reset
        let bgR = reset
        let cR = reset
        // Colours End

        // Animation
        if (animation && this.animationStartTime==undefined) {
            this.animationStartTime = Date.now()
            this.animation = animation
        }

        // Re-mix data to match the number of columns
        let columns = data.map(v => Math.round(v))

        const histogram = {}
        columns.forEach(value => {
            if (histogram[value]==undefined) {
                histogram[value] = 1
            } else {
                histogram[value]++
            }
        })
        const hKeys = Object.keys(histogram).map(k => parseFloat(k)).sort((a,b) => a<b?-1:1)
        const hValues = hKeys.map(k => histogram[k])

        const finalData = {
            keys: [],
            values: [],
        }

        // for (let hi=0; hi<hValues.length; hi++) {
        for (let hi=hKeys[0]; hi<hKeys[hKeys.length-1]; hi++) {
            finalData.keys.push(hi)
            finalData.values.push(hKeys.includes(hi) ? histogram[hi] : 0)

            hKeys[hi] = hKeys[hi]==undefined ? 0 : hKeys[hi]
            hValues[hi] = hValues[hi]==undefined ? 0 : hValues[hi]
        }

        const xAxis = `       ${keyC}`+finalData.keys.map(v => this.padNum(v)).join("")+`${cR}\n`
        let maximumYAxisValue = finalData.values.reduce((p,c) => Math.max(p,c), -Infinity)
        this.rows = rows
        this.yAxisValues = [0].concat([...new Array(rows-2)]
            .map((_, vi) => Math.round(maximumYAxisValue/(rows-1) * (vi+1))))
            .concat(maximumYAxisValue)

        if (title) {
            this.title = title
            process.stdout.write(`${titleC}${this.padNum(title, xAxis.length-6)}${reset}\n`)
        }

        for (let r=rows-1; r>=0; r--) {
            const yAxisVal = this.yAxisValues[r].toString().padStart(4)
            let hGramRow
            let rowString

            if (r==0) {
                hGramRow = finalData.values.map(v => `_${barC}${this.getFill(v, r)}${barR}_`)
                rowString = `${keyC}${yAxisVal}${cR} ${axisC}|${cbgC}${hGramRow.join("")}${bgR}\n`
            } else {
                hGramRow = finalData.values.map(v => ` ${this.getFill(v, r)} `)
                rowString = `${keyC}${yAxisVal}${barC} ${axisC}|${axisR}${cbgC}${hGramRow.join("")}${bgR}\n`
            }

            process.stdout.write(rowString)
        }
        process.stdout.write(xAxis)
        this.clearRows = rows + 1 + (title ? 1 : 0)

        if (this.animation) {

            let now = Date.now()

            if (now - this.animationStartTime < this.animation) {
                setTimeout(() => this.refresh(data, {title, rows, colours, animation}), 10)
            } else {
                this.animation = 0
                this.animationStartTime = undefined
                setTimeout(() => this.refresh(data, {title, rows, colours, animation: 0}), 10)
            }
        }
    }

    static refresh (data, opts) {

        if (this.animationStartTime) {
            process.stdout.moveCursor(0, -this.clearRows)
            process.stdout.clearLine()
            process.stdout.cursorTo(0)
        } else {
            this.clear()
        }

        // Avoid clearing misalignment issues if it's removed
        if (this.title && !opts.title) {
            opts.title = " "
        }

        this.plot(data, opts)
    }

    static clear () {
        for (let i=this.clearRows; i>0; i--) {
            process.stdout.moveCursor(0, -1)
            process.stdout.clearLine()
            process.stdout.cursorTo(0)
        }
        this.clearRows = 0
    }

    static getFill (v, r) {

        const rowHeight = this.yAxisValues[1] - this.yAxisValues[0]

        if (this.animationStartTime) {
            let now = Date.now()

            if (now - this.animationStartTime < this.animation) {
                v *= (1 - Math.cos(((now - this.animationStartTime) / this.animation) * Math.PI)) / 2
            }
        }

        if (v > this.yAxisValues[r]) {
            // If there's a value above
            if (r<(this.rows-1)) {
                const extra = v - this.yAxisValues[r]

                if (rowHeight - extra > rowHeight/2) {
                    return "▄▄"
                } else {
                    return "██"
                }

            } else {
                return "██"
            }

        } else {
            return r ? "  " : `${this.axisC}__`
        }
    }

    static padNum (num, amount=4) {
        num = num.toString()
        const leftPad = Math.max(Math.floor((amount - num.length) / 2), 0)
        const rightPad = Math.max(amount - (num.length + leftPad), 0)
        return " ".repeat(leftPad)+num+" ".repeat(rightPad)
    }
}