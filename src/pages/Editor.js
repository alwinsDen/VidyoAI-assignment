import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import {
  Box,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from "@chakra-ui/react";
import { MdGraphicEq } from "react-icons/md";
import { IoPlayBackOutline, IoPlayForwardOutline } from "react-icons/io5";
import { TbRewindBackward5, TbRewindForward5 } from "react-icons/tb";
import { AiOutlineCloudUpload } from "react-icons/ai";
import TryOut from "./TryOut.svg";
import { BsFillPlayFill, BsPauseFill } from "react-icons/bs";
import "./Editor.scss";
import { toast } from "react-toastify";

function Editor() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState({ duration: 0 });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileSelectUserRef = useRef(null);
  const [audioPresent, setAudioPresent] = useState(false);

  useEffect(() => {
    videoRef.current = document.createElement("video");
    wavesurferRef.current = WaveSurfer.create({
      container: "#waveform",
      waveColor: "violet",
      progressColor: "purple",
      backend: "MediaElement",
    });

    wavesurferRef.current.on("seek", (progress) => {
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
      // video.load();
      video.onloadedmetadata = () => {
        const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(video);
        const analyser = audioContext.createAnalyser();

        const gainNode = audioContext.createGain();

        gainNode.gain.value = 0;

        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination)
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let audioPres = false;

        function hasAudio() {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, value) => a + value, 0);
          return sum > 0;
        }

        video.addEventListener("timeupdate", () => {
          if (!audioPres) {
            if (hasAudio()) {
              console.log("video has audio");
              audioPres = true;
            } else {
              console.log("video doesn't have audio");
            }
          }
        });

        // video.muted = true;
        video.play();

        setTimeout(()=>{
          video.pause();
          if (audioPres) {
            gainNode.gain.value = 1
            video.currentTime = 0;
            video.addEventListener("seeked", function drawThumbnail() {
              drawVideoFrame();
              video.pause();
              video.removeEventListener("seeked", drawThumbnail);
            });
            setVideoMetadata({
              duration: video.duration,
              height: video.videoHeight,
              width: video.videoWidth,
              aspectRatio: video.videoWidth / video.videoHeight,
              range: `${video.seekable.start(0)} - ${video.seekable
                  .end(0)
                  .toFixed(2)}`,
            });
          } else{
            toast.error("The uploaded video has no Audio. Please try again.");
            setTimeout(()=>{window.location.reload()}, 3000)
          }
        }, 1000)
      };
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
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
    console.log("HISEAIORJ ISHEIU RIUSERUI SIUE RIUES");
    if (!isPlaying) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );
    }
    if (canvas && video) {
      const ctx = canvas.getContext("2d");
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
        setVideoMetadata((prevMdata) => ({ ...prevMdata, currentTime }));
      };
      video.addEventListener("timeupdate", onTimeUpdate);
      return () => video.removeEventListener("timeupdate", onTimeUpdate);
    }
  }, [videoSrc]);

  const handleVideoSliderChange = (event) => {
    const time = event;
    videoRef.current.currentTime = time;
    wavesurferRef.current.seekTo(time / videoMetadata.duration);
  };
  const rows = new Array(8).fill(null);
  const [isVisible, setIsVisible] = useState(false);

  const moveBackward = () => {
    const video = videoRef.current;
    video.currentTime = Math.max(0, video.currentTime - 5);
  };

  const relayBackward = () => {
    const video = videoRef.current;
    video.currentTime = 0;
  };

  const relayForward = () => {
    const video = videoRef.current;
    video.currentTime = video.duration;
  };

  const moveForward = () => {
    const video = videoRef.current;
    video.currentTime = Math.min(video.duration, video.currentTime + 5);
  };

  function toMMSS(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toFixed(0).toString()}`;
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "60%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "640px",
            height: "360px",
            borderRadius: "10px",
            boxShadow: "0px 2px 11px 4px rgba(0, 0, 0, 0.25)",
            position: "relative",
          }}
        >
          {!videoMetadata.duration && (
            <img
              src={TryOut}
              style={{
                position: "absolute",
                left: "140px",
                top: "55px",
              }}
            />
          )}
          {videoMetadata.duration != 0 && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                cursor: "pointer",
              }}
              onMouseEnter={() => setIsVisible(true)}
              onMouseLeave={() => setIsVisible(false)}
            >
              {isVisible && (
                <div className={isVisible ? "fade-in" : "fade-out"}>
                  {isPlaying ? (
                    <BsPauseFill
                      size={150}
                      color={"#ffffff"}
                      onClick={togglePlayPause}
                    />
                  ) : (
                    <BsFillPlayFill
                      size={150}
                      color={"#ffffff"}
                      onClick={togglePlayPause}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          <canvas
            ref={canvasRef}
            width="640"
            height="360"
            style={{
              borderRadius: "10px",
            }}
          />
        </div>
        <input
          type="file"
          ref={fileSelectUserRef}
          accept="video/*"
          onChange={handleFileChange}
          style={{
            display: "none",
          }}
        />
        <div
          style={{
            width: "640px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <button>
              <IoPlayBackOutline onClick={relayBackward} />
            </button>
            <button>
              <TbRewindBackward5 onClick={moveBackward} />
            </button>
            <p>0:00</p>
            <Slider
              aria-label="slider-ex-4"
              value={videoRef.current?.currentTime || 0}
              min={0}
              max={videoMetadata.duration}
              onChange={(e) => handleVideoSliderChange(e)}
            >
              <SliderTrack bg="red.100">
                <SliderFilledTrack bg="tomato" />
              </SliderTrack>
              <SliderThumb boxSize={6}>
                <Box color="tomato" as={MdGraphicEq} />
              </SliderThumb>
            </Slider>
            <p>{toMMSS(videoMetadata.duration.toFixed(2))}</p>
            <button>
              <TbRewindForward5 onClick={moveForward} />
            </button>
            <button>
              <IoPlayForwardOutline onClick={relayForward} />
            </button>
          </div>
          <div
            style={{
              width: "100%",
              position: "relative",
            }}
          >
            <div
              id="waveform"
              style={{
                marginTop: "15px",
                width: "100%",
              }}
            />
            <p
              style={{
                position: "absolute",
                top: 0,
                left: "10px",
                color: "#868686",
                zIndex: -1,
              }}
            >
              Audio Waveform
            </p>
          </div>
        </div>
      </div>
      <div
        style={{
          height: "80%",
          width: "1%",
          borderLeft: "solid 1px #000000",
        }}
      ></div>
      <div
        style={{
          height: "50%",
          width: "39%",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          gap: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <button
            className={"uploadVideo"}
            onClick={() => {
              fileSelectUserRef.current.click();
            }}
            disabled={videoMetadata.duration !== 0}
          >
            <AiOutlineCloudUpload />
            <p
              style={{
                fontWeight: 600,
              }}
            >
              {videoMetadata.duration !== 0
                ? "Video uploaded!!"
                : "Upload Video"}
            </p>
          </button>
          <p
            style={{
              color: "#868686",
              fontWeight: 600,
            }}
          >
            Upload Video in .mp4 format.
            <span>
              {videoMetadata.duration !== 0 ? (
                <a href={"self"}>
                  &nbsp;
                  <i>
                    <u>Reload</u>
                  </i>
                </a>
              ) : (
                ""
              )}
            </span>
          </p>
        </div>
        {videoSrc && (
          <div>
            <p style={{ fontWeight: 600 }}>Meta data:</p>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid black", padding: "8px" }}>
                    Duration
                  </td>
                  <td style={tbStyle}>
                    {videoMetadata.duration.toFixed(2)} seconds
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid black", padding: "8px" }}>
                    Height
                  </td>
                  <td style={tbStyle}>{videoMetadata.height}px</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid black", padding: "8px" }}>
                    Width
                  </td>
                  <td style={tbStyle}>{videoMetadata.width}px</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid black", padding: "8px" }}>
                    Range
                  </td>
                  <td style={tbStyle}>{videoMetadata.range}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

//table styling
const tbStyle = {
  border: "1px solid black",
  padding: "8px",
  fontWeight: 600,
};

export default Editor;
