const app = new Vue({
    el: '#app',
    data() {
        return {
            songName: '',
            loopStart: 0,
            loopEnd: 0,
            playbackRate: 1
            // fullWave: null,
            // leftWave: null,
            // rightWave: null,
        }
    },
    methods: {
        something() {
            // // console.log(this.song)
            // this.fullWave.loop()
        },
        handleFileInput(e) {
            let path = URL.createObjectURL(e.target.files[0])
            this.fullWave.fileInput(path)
        },
        onRecord() {
            this.fullWave.onRecord()
        }
    },
    mounted() {
        let loopWaveData
        let leftSound, rightSound

        let bgColor = 20
        let waveColor = 255












        const mainSketch = z => {
            let domElement
            
            let canvas
            let gfx
            
            let isMouseDown = false
            
            let loopStartPos = 0
            let loopEndPos = 0
            
            let song
            let fullWaveData

            let isPlaying = false

            let mic
            let recorder
            let recordingState = 'ready'

            z.setup = () => {
                // domElement = this.fullWave._userNode  // ok, 'this' points to Vue instance so grab the p5 instance via vue data object (weird)
                domElement = this.$refs.full
                
                canvas = z.createCanvas(...getDomDimensions())

                // init gfx
                gfx = z.createGraphics(...getDomDimensions())
                gfx.background(bgColor)

                // init song
                song = z.loadSound('itsgonnarain.wav', songLoaded)
                
                // event listeners
                // mouseReleased listened to globally otherwise don't get the event if off the canvas
                canvas.mousePressed(mousePressed)
                canvas.drop(dropped)
                
                // loop rect init
                loopStartPos = 0
                loopEndPos = z.width
                
                // init players
                leftSound = new p5.SoundFile()
                rightSound = new p5.SoundFile()
                leftSound.playMode('restart')
                rightSound.playMode('restart')
                leftSound.pan(-0.5)
                rightSound.pan(0.5)

                // recording setup
                mic = new p5.AudioIn()
                mic.start()

                recorder = new p5.SoundRecorder()
                recorder.setInput(mic)
            }

            z.draw = () => {
                if (recordingState === 'recording') {
                    fullWaveData = recorder._getBuffer()[0]
                    drawWaveToGfx()
                }


                z.image(gfx, 0, 0)               
                
                loopRect()
                drawPositionMarker()
                
                // console.log('_playing:', song._playing, '_looping:', song._looping) 
                // console.log('isPlaying():', song.isPlaying(), 'isLooping():', song.isLooping())

            }

            const stopSounds = () => {
                leftSound.stop()
                rightSound.stop()
                isPlaying = false
            }

            const dropped = (file) => {
                // console.log(file.file)
                this.songName = file.name

                // console.log(file.name)
                // console.log(event.target.files[0])
                let path = URL.createObjectURL(file.file)
                console.log(path)
                song.setPath(path, songLoaded)
            }

            const songLoaded = (loadedSong) => {
                // console.log(loadedSong)
                leftSound.stop()
                rightSound.stop()
                isPlaying = false

                song = loadedSong

                fullWaveData = loadedSong.buffer.getChannelData(0)
                loopWaveData = fullWaveData

                leftSound.buffer = loadedSong.buffer  // set the player buffers
                rightSound.buffer = loadedSong.buffer

                loopWaveData = leftSound.buffer.getChannelData(0)

                this.songName = song.file
                this.loopStart = 0
                this.loopEnd = loadedSong.duration()

                drawWaveToGfx()
                leftWave.drawWaveToGfx()
                rightWave.drawWaveToGfx()
            }

            z.fileInput = (path) => {
                song.setPath(path, songLoaded)
            }

            z.onRecord = () => {
                if (recordingState === 'ready') {
                    console.log('...recording')

                    stopSounds()

                    recorder.record(song)
                    recordingState = 'recording'
                } else if (recordingState === 'recording') {
                    recorder.stop()

                    fullWaveData = song.buffer.getChannelData(0)
                    loopWaveData = fullWaveData

                    leftSound.buffer = song.buffer  // set the player buffers
                    rightSound.buffer = song.buffer

                    loopWaveData = leftSound.buffer.getChannelData(0)

                    this.songName = 'recorded sample'
                    this.loopStart = 0
                    this.loopEnd = song.duration()

                    drawWaveToGfx()
                    leftWave.drawWaveToGfx()
                    rightWave.drawWaveToGfx()

                    recordingState = 'ready'
                }
            }

            const drawWaveToGfx = () => {
                // console.log(gfx.width, gfx.height)
                gfx.background(bgColor)
                // gfx.clear()
                gfx.noFill()
                gfx.stroke(waveColor, 100)
                gfx.strokeWeight(1)

                gfx.push()
                gfx.translate(0, gfx.height / 2)

                gfx.beginShape()
                for (let i = 0; i < fullWaveData.length; i += 100) {
                    let x = z.map(i, 0, fullWaveData.length, 0, gfx.width)
                    let y = z.map(fullWaveData[i], 0, 1, 0, gfx.height / 2)
                    gfx.vertex(x, y)
                }
                gfx.endShape()
                gfx.pop()
            }

            const loopRect = () => {
                if (isMouseDown) {
                    // console.log(z.mouseX, z.mouseY)
                    loopEndPos = z.constrain(z.mouseX, 0, z.width)

                    start = Math.min(loopStartPos, loopEndPos)
                    end = Math.max(loopStartPos, loopEndPos)
                    this.loopStart = z.map(start, 0, gfx.width, 0, song.duration())
                    this.loopEnd = z.map(end, 0, gfx.width, 0, song.duration())

                    // console.log('start', this.loopStart, 'end', this.loopEnd)
                }

                z.rectMode(z.CORNERS)
                z.noStroke()
                z.fill(255, 20)

                let rectStart = z.map(this.loopStart, 0, song.duration(), 0, z.width)
                let rectEnd = z.map(this.loopEnd, 0, song.duration(), 0, z.width)
                z.rect(rectStart, 0, rectEnd, z.height)
            }

            

            const mousePressed = (e) => {   // just on this canvas
                isMouseDown = true
                loopStartPos = loopEndPos = z.mouseX
            }

            

            z.mouseReleased = () => {  // global to the window
                
                if (isMouseDown) {  // if at the end of a drag
                    console.log('..mouse was down')
                    let start = 48000 * this.loopStart
                    let end = 48000 * this.loopEnd
    
                    if (start === end) {  // if user just clicked (meaning 0 frames)
                        end = start + 2000
                    }

                    loopWaveData = fullWaveData.slice(start, end)
    
                    leftSound.setBuffer([loopWaveData])
                    rightSound.setBuffer([loopWaveData])

                    leftWave.drawWaveToGfx()
                    rightWave.drawWaveToGfx()


                    if (isPlaying) { 
                        console.log('...restarting')
                        leftSound.loop()
                        rightSound.loop()
                    }
                }
                isMouseDown = false

            }

            z.windowResized = () => {
                z.resizeCanvas(...getDomDimensions())
                gfx = z.createGraphics(...getDomDimensions())

                drawWaveToGfx()
            }

            
            

            const getDomDimensions = () => {
                return [ domElement.offsetWidth, domElement.offsetHeight ]
            }

            const drawPositionMarker = () => {
                let x = z.map(song.currentTime(), 0, song.duration(), 0, z.width)

                z.noFill()
                z.stroke(255)
                z.strokeWeight(1)
                z.line(x, 0, x, z.height)
            }

            z.keyPressed = e => {
                if (e.key === ' ') {

                    if (isPlaying) {
                        leftSound.stop()
                        rightSound.stop()
                        isPlaying = false
                    } else {
                        leftSound.loop(0, 1, 1) 
                        rightSound.loop(0, this.playbackRate, 1)
                        isPlaying = true
                    }
                }
            }

            // ===== unused functions  =====
            z.loop = () => {
                let start = 4
                let dur = 0.5
                let end = start + dur
                song.stop()
                song.loop(0, 1, 1, start, end)
            }

            const drawMousePos = () => {
                z.textSize(16)
                z.noStroke()
                z.fill(255)
                z.text([z.mouseX, z.mouseY], 0, 16)
            }
        }















        let leftrightSketch = z => {
            // console.log(this)
            let domElement

            let canvas
            let waveGfx, markerGfx

            let maskStyle = false
            
            let markerWidth = 20

            // using function() allows this.leftWave._userNode
            // fat arrow makes 'this' the vue instance
            z.setup = function() {
                domElement = this._userNode
                // domElement = this.$refs.left

                canvas = z.createCanvas(...getDomDimensions())

                // init waveGfx
                waveGfx = z.createGraphics(...getDomDimensions())
                markerGfx = z.createGraphics(...getDomDimensions())
                waveGfx.background(0)

            }

            z.draw = () => {
                // z.background('lime')
                if (maskStyle) {
                    z.background(0, 20)

                    drawMarkerToGfx()

                    let waveImage = waveGfx.get()  // turn graphics into p5.Image
                    waveImage.mask(markerGfx.get())  // mask it using the p5.Image of marker (transparent bg)

                    z.image(waveImage, 0, 0)  // draw the created masked waveImage

                    drawPositionMarker()
                } else {
                    z.background('lime')

                    z.image(waveGfx, 0, 0)

                    drawPositionMarker()
                }
                


            }

            // needs to be accessed from outside sketch
            z.drawWaveToGfx = () => {
                // console.log('draw')
                waveGfx.background(bgColor)
                // waveGfx.clear()
                waveGfx.noFill()
                waveGfx.stroke(waveColor, 100)

                waveGfx.push()
                waveGfx.translate(0, waveGfx.height / 2)

                waveGfx.beginShape()
                for (let i = 0; i < loopWaveData.length; i += 100) {
                    let x = z.map(i, 0, loopWaveData.length, 0, waveGfx.width)
                    let y = z.map(loopWaveData[i], 0, 1, 0, waveGfx.height / 2)
                    waveGfx.vertex(x, y)
                }
                waveGfx.endShape()
                waveGfx.pop()
            }

            const drawMarkerToGfx = () => {
                let currentTime
                if (domElement.id === 'right-wave-div') {
                    currentTime = rightSound.currentTime()
                } else {
                    currentTime = leftSound.currentTime()
                }
                let x = z.map(currentTime, 0, leftSound.duration(), 0, z.width)

                markerGfx.clear()
                markerGfx.noStroke()
                markerGfx.fill(0)

                markerGfx.rect(x, 0, -markerWidth, z.height)  // rectMode(z.CORNER) 3rd param is width
            }

            const drawPositionMarker = () => {
                let currentTime
                if (domElement.id === 'right-wave-div') {
                    currentTime = rightSound.currentTime()
                } else {
                    currentTime = leftSound.currentTime()
                }
                let x = z.map(currentTime, 0, leftSound.duration(), 0, z.width)
                
                // let x = z.map(leftSound.currentTime(), 0, leftSound.duration(), 0, z.width)

                z.noFill()
                z.stroke(255)
                z.strokeWeight(2)
                z.line(x, 0, x, z.height)
            }
            
            const getDomDimensions = () => {
                return [ domElement.clientWidth, domElement.clientHeight ]
            }

            z.windowResized = () => {
                z.resizeCanvas(...getDomDimensions())
                gfx = z.createGraphics(...getDomDimensions())

                z.drawWaveToGfx()
            }

            // ===== tests =====
            const drawMousePos = () => {
                z.textSize(16)
                z.noStroke()
                z.fill(255)
                z.text([z.mouseX, z.mouseY], 0, 16)
            }
        }












        // doesn't work to have more than 1 'sketch' function

        // this.fullWave = new p5(mainSketch, 'full-wave-div')
        // this.leftWave = new p5(leftrightSketch, 'left-wave-div')
        // this.rightWave = new p5(leftrightSketch, 'right-wave-div')


        this.fullWave = new p5(mainSketch, 'full-wave-div')
        const leftWave = new p5(leftrightSketch, 'left-wave-div')
        const rightWave = new p5(leftrightSketch, 'right-wave-div')
        

    }
    
    
})


//  THERE IS A BUG WITH .isPlaying()  when calling .play() or .loop() when already playing
// _playing toggles every time you call loop()    