import React, {useEffect, useRef, useState} from "react";
import WaveSurfer from "wavesurfer.js";
import {Box, Slider, SliderFilledTrack, SliderThumb, SliderTrack} from "@chakra-ui/react";
import {MdGraphicEq} from "react-icons/md";
import {IoPlayBackOutline, IoPlayForwardOutline} from "react-icons/io5";
import {TbRewindBackward5, TbRewindForward5} from "react-icons/tb";
import {AiOutlineCloudUpload} from "react-icons/ai";

function Editor() {
    const [videoSrc, setVideoSrc] = useState(null);
    const [videoMetadata, setVideoMetadata] = useState({duration: 0});
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wavesurferRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const fileSelectUserRef = useRef(null);

    useEffect(() => {
        videoRef.current = document.createElement('video');
        wavesurferRef.current = WaveSurfer.create({
            container: '#waveform',
            waveColor: 'violet',
            progressColor: 'purple',
            backend: 'MediaElement'
        });

        wavesurferRef.current.on('seek', (progress) => {
            if (videoRef.current) {
                const newTime = videoRef.current.duration * progress;
                videoRef.current.currentTime = newTime;
            }
        });

        return () => {
            if (videoRef.current) {
                URL.revokeObjectURL(videoRef.current.src);
                videoRef.current = null;
            }
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
            }
        };
    }, []);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const video = videoRef.current;
            console.log("Here is the file", url);
            video.src = url;
            setVideoSrc(url);
            video.load();
            video.onloadedmetadata = () => {
                console.log(`Duration: ${video.duration}`);
                console.log(`Video Width: ${video.videoWidth}`);
                console.log(`Video Height: ${video.videoHeight}`);
                console.log(`Video Aspect Ratio: ${video.videoWidth / video.videoHeight}`);
                console.log(`Ready State: ${video.readyState}`);
                console.log(`Seekable Ranges: ${video.seekable.start(0)} - ${video.seekable.end(0)}`);
                console.log(`Played Ranges: ${video.played.length}`);
                setVideoMetadata({
                    duration: video.duration
                });
                video.currentTime = 0;
                video.addEventListener('seeked', function drawThumbnail() {
                    drawVideoFrame();
                    video.pause();
                    video.removeEventListener('seeked', drawThumbnail);
                });
            };
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            if (audioBuffer.numberOfChannels === 0) {
                URL.revokeObjectURL(url);
                setVideoSrc(null);
                return;
            }
        }
    };

    const drawVideoFrame = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        console.log("HISEAIORJ ISHEIU RIUSERUI SIUE RIUES")
        if (!isPlaying) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        if (canvas && video) {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (!video.paused && !video.ended) {
                requestAnimationFrame(drawVideoFrame);
            }
        }
    };

    const togglePlayPause = () => {
        const video = videoRef.current;
        if (video.paused || video.ended) {
            setIsPlaying(true);
            video.play();
            drawVideoFrame();

        } else {
            setIsPlaying(false);
            video.pause();

        }
    };


    useEffect(() => {
        if (videoSrc) {
            wavesurferRef.current.load(videoSrc);
        }
    }, [videoSrc]);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            const onTimeUpdate = () => {
                const currentTime = video.currentTime;
                const duration = video.duration;
                const progress = currentTime / duration;
                wavesurferRef.current.seekTo(progress);
                setVideoMetadata((prevMdata) => ({...prevMdata, currentTime}));
            };
            video.addEventListener('timeupdate', onTimeUpdate);
            return () => video.removeEventListener('timeupdate', onTimeUpdate);
        }
    }, [videoSrc]);

    const handleVideoSliderChange = (event) => {
        const time = event;
        videoRef.current.currentTime = time;
        wavesurferRef.current.seekTo(time / videoMetadata.duration);
    };

    return <div style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems:"center"
    }}>
        <div style={{
            height: "100%",
            width: "60%",
            display:"flex",
            flexDirection:"column",
            alignItems:"center",
            justifyContent:"center"
        }}>
            <canvas ref={canvasRef} width="640" height="360" onClick={togglePlayPause} style={
                {
                    borderRadius: "10px",
                    boxShadow: "0px 2px 11px 4px rgba(0, 0, 0, 0.25)"
                }
            }/>
            <input type="file" ref={fileSelectUserRef} accept="video/*" onChange={handleFileChange} style={{
                display: "none"
            }}/>
            <div style={{
                width: "640px"
            }}>
                <div style={{
                    display: "flex",
                    gap: "15px",
                    marginTop:"20px"
                }}>
                    <button>
                        <IoPlayBackOutline/>
                    </button>
                    <button>
                        <TbRewindBackward5/>
                    </button>
                    <Slider aria-label='slider-ex-4' value={videoRef.current?.currentTime || 0}
                            min={0}
                            max={videoMetadata.duration}
                            onChange={(e) => handleVideoSliderChange(e)}
                    >
                        <SliderTrack bg='red.100'>
                            <SliderFilledTrack bg='tomato'/>
                        </SliderTrack>
                        <SliderThumb boxSize={6}>
                            <Box color='tomato' as={MdGraphicEq}/>
                        </SliderThumb>
                    </Slider>
                    <button>
                        <TbRewindForward5/>
                    </button>
                    <button>
                        <IoPlayForwardOutline/>
                    </button>
                </div>
                <div style={{
                    width:"100%",
                    position:"relative",
                }}>
                    <div id="waveform" style={{
                        marginTop:"15px",
                        width:"100%"
                    }}/>
                    <p style={{
                        position:"absolute",
                        top: 0,
                        left: "10px",
                        color: "#868686",
                        zIndex: -1
                    }
                    }>Audio Waveform</p>
                </div>
            </div>
        </div>
        <div
            style={{
            height: "80%",
            width: "1%",
                borderLeft:"solid 1px #000000"
        }}>
        </div>
        <div style={{
            height: "100%",
            width: "39%",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            flexDirection:"column"
        }}>
            <div
            style={{
                display:"flex",
                flexDirection:"column",
                alignItems:"center",
                justifyContent:"center",
                gap:"10px",
            }}
            >
                <button style={{
                    display:"flex",
                    alignItems:"center",
                    gap: "8px",
                    borderRadius:"7.719px",
                    background:"#64CAE0",
                    padding: "10px",
                    color:"#ffffff",
                }}
                onClick={()=>{
                    fileSelectUserRef.current.click()
                }}
                >
                    <AiOutlineCloudUpload/>
                    <p style={{
                        fontWeight: 600
                    }}>Upload Video</p>
                </button>
                <p style={{
                    color: "#868686",
                    fontWeight: 600
                }}>Upload Video in .mp4 format.</p>
            </div>
            <div>
                {videoSrc && (
                    <div>
                        <strong>Duration:</strong> {videoMetadata.duration.toFixed(2)} seconds
                        <button onClick={togglePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
                    </div>
                )}
            </div>
        </div>
    </div>
}

export default Editor;
