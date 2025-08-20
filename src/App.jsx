import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload, Download, FileAudio, Play, Pause, Square } from 'lucide-react';

const SpeechToTextApp = () => {
  const [currentPage, setCurrentPage] = useState('record');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadTranscript, setUploadTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(prev => prev + finalTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }, []);

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsRecording(false);
  };

  const downloadRecording = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording_${new Date().toISOString().slice(0, 10)}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const playPauseRecording = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setUploadTranscript('');
      
      // Create audio URL for playback
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  // Simulated file transcription (in real app, you'd send to a transcription service)
  const transcribeFile = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // This is a simulation - in reality, you'd use a service like:
    // - Google Cloud Speech-to-Text API
    // - AWS Transcribe
    // - Azure Cognitive Services
    // - OpenAI Whisper API
    
    const simulatedTranscript = `This is a simulated transcription of the uploaded file "${uploadedFile.name}". In a real application, this would be processed by a speech-to-text service to generate accurate transcription of the audio content.`;
    
    setUploadTranscript(simulatedTranscript);
    setIsProcessing(false);
  };

  const clearAll = () => {
    setTranscript('');
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setUploadTranscript('');
    setAudioUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTranscript = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen  bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-800">Speech to Text</h1>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage('record')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'record'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Record Audio
              </button>
              <button
                onClick={() => setCurrentPage('upload')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'upload'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {currentPage === 'record' ? (
          /* Record Page */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Voice Recording & Transcription
              </h2>
              
              {/* Recording Controls */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white shadow-lg`}
                  >
                    {isRecording ? (
                      <Square className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                  {isRecording && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                        {formatTime(recordingTime)}
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 text-center">
                  {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                </p>

                {/* Audio Playback */}
                {audioUrl && (
                  <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                    <button
                      onClick={playPauseRecording}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    />
                    <span className="text-sm text-gray-600">Recording ready</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  {audioBlob && (
                    <button
                      onClick={downloadRecording}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download WAV</span>
                    </button>
                  )}
                  {(transcript || audioBlob) && (
                    <button
                      onClick={clearAll}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Transcription</h3>
                  <button
                    onClick={() => downloadTranscript(transcript, 'transcript.txt')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
                </div>
              </div>
            )}

            {!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window) && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-yellow-700">
                  Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari for the best experience.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Upload Page */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Audio File Transcription
              </h2>

              {/* File Upload */}
              <div className="flex flex-col items-center space-y-6">
                <div className="w-full max-w-md">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> audio file
                      </p>
                      <p className="text-xs text-gray-500">WAV, MP3, M4A (MAX. 10MB)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {/* File Info */}
                {uploadedFile && (
                  <div className="bg-gray-50 p-4 rounded-lg w-full max-w-md">
                    <div className="flex items-center space-x-3">
                      <FileAudio className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    {audioUrl && (
                      <div className="mt-3">
                        <audio controls className="w-full">
                          <source src={audioUrl} type={uploadedFile.type} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  {uploadedFile && (
                    <button
                      onClick={transcribeFile}
                      disabled={isProcessing}
                      className={`px-6 py-2 rounded-lg flex items-center space-x-2 ${
                        isProcessing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <FileAudio className="w-4 h-4" />
                          <span>Transcribe Audio</span>
                        </>
                      )}
                    </button>
                  )}
                  {uploadedFile && (
                    <button
                      onClick={clearUpload}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Transcript Display */}
            {uploadTranscript && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Transcription Result</h3>
                  <button
                    onClick={() => downloadTranscript(uploadTranscript, 'file_transcript.txt')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">{uploadTranscript}</p>
                </div>
              </div>
            )}

            {/* Info Note */}
            <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-700">
                <strong>Note:</strong> This demo uses simulated transcription. In a production app, integrate with services like Google Cloud Speech-to-Text, AWS Transcribe, or OpenAI Whisper API for accurate results.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechToTextApp;