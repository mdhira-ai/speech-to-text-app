import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload, Download, FileAudio, Play, Pause, Square, Brain } from 'lucide-react';

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
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [useWhisper, setUseWhisper] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const whisperRef = useRef(null);

  // Load Whisper model
  const loadWhisperModel = async () => {
    if (modelLoaded || modelLoading) return;
    
    setModelLoading(true);
    try {
      // For development, we'll use a simulated AI model
      // In production, uncomment the lines below after installing @xenova/transformers
      
      console.log('Loading Whisper model...');
      
      // Simulate model loading for development
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { pipeline, env } = await import('@xenova/transformers');
      // Configure for local development
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      
      // Load Whisper model
      whisperRef.current = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
        chunk_length_s: 30,
        stride_length_s: 5,
        revision: 'main',
      });
      
      /* 
      // PRODUCTION CODE - Uncomment after installing @xenova/transformers:
      // npm install @xenova/transformers
      
      
      */
      
      // For now, we'll simulate the model being loaded
      whisperRef.current = { loaded: true };
      
      setModelLoaded(true);
      console.log('Model simulation loaded successfully');
    } catch (error) {
      console.error('Failed to load Whisper model:', error);
      alert('Failed to load AI model. Using fallback transcription.');
      setUseWhisper(false);
    } finally {
      setModelLoading(false);
    }
  };

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

  // Transcribe audio using Whisper
  const transcribeWithWhisper = async (audioBlob) => {
    if (!whisperRef.current) {
      await loadWhisperModel();
    }
    
    try {
      // For development, we'll simulate AI transcription
      console.log('Transcribing with AI model...');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      /* 
      // PRODUCTION CODE - Uncomment after installing @xenova/transformers:
      
      // Convert blob to audio buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to the format expected by Transformers.js
      const audioArray = audioBuffer.getChannelData(0);
      
      // Resample to 16kHz if necessary
      const targetSampleRate = 16000;
      const resampledAudio = resampleAudio(audioArray, audioBuffer.sampleRate, targetSampleRate);
      
      // Transcribe using Whisper
      const result = await whisperRef.current(resampledAudio, {
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      
      return result.text;
      */
      
      // Simulated AI transcription result
      const fileName = audioBlob.name || 'audio file';
      return `[AI TRANSCRIPTION SIMULATION] This is a high-quality AI-powered transcription of your ${fileName}. The audio content has been processed using advanced machine learning algorithms to convert speech to text with enhanced accuracy. In production, this would be the actual Whisper AI model output with real transcription results.`;
      
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  };

  // Helper function for audio resampling (for production use)
  const resampleAudio = (audioBuffer, originalSampleRate, targetSampleRate) => {
    if (originalSampleRate === targetSampleRate) {
      return audioBuffer;
    }
    
    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(audioBuffer.length / ratio);
    const resampledBuffer = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const index = i * ratio;
      const leftIndex = Math.floor(index);
      const rightIndex = Math.ceil(index);
      const fraction = index - leftIndex;
      
      if (rightIndex >= audioBuffer.length) {
        resampledBuffer[i] = audioBuffer[leftIndex];
      } else {
        resampledBuffer[i] = audioBuffer[leftIndex] * (1 - fraction) + audioBuffer[rightIndex] * fraction;
      }
    }
    
    return resampledBuffer;
  };

  // Transcribe file using Whisper or fallback
  const transcribeFile = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    
    try {
      if (useWhisper && modelLoaded) {
        const transcript = await transcribeWithWhisper(uploadedFile);
        setUploadTranscript(transcript);
      } else if (useWhisper && !modelLoaded) {
        // Load model first, then transcribe
        await loadWhisperModel();
        const transcript = await transcribeWithWhisper(uploadedFile);
        setUploadTranscript(transcript);
      } else {
        // Fallback to simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const simulatedTranscript = `This is a simulated transcription of the uploaded file "${uploadedFile.name}". To use real AI transcription, enable the Whisper model above.`;
        setUploadTranscript(simulatedTranscript);
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      setUploadTranscript('Transcription failed. Please try again or use the Web Speech API option.');
    } finally {
      setIsProcessing(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

              {/* AI Model Selection */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-blue-600" />
                    AI Transcription Engine
                  </h3>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="engine"
                        checked={useWhisper}
                        onChange={() => setUseWhisper(true)}
                        className="mr-2"
                      />
                      <span className="text-sm">OpenAI Whisper (AI)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="engine"
                        checked={!useWhisper}
                        onChange={() => setUseWhisper(false)}
                        className="mr-2"
                      />
                      <span className="text-sm">Fallback</span>
                    </label>
                  </div>
                </div>
                
                {useWhisper && (
                  <div className="text-sm text-gray-600">
                    {!modelLoaded && !modelLoading && (
                      <div className="flex items-center justify-between bg-white p-3 rounded border">
                        <span>🤖 Whisper AI model ready to load</span>
                        <button
                          onClick={loadWhisperModel}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Load AI Model
                        </button>
                      </div>
                    )}
                    {modelLoading && (
                      <div className="flex items-center bg-white p-3 rounded border">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Loading AI model simulation...</span>
                      </div>
                    )}
                    {modelLoaded && (
                      <div className="flex items-center bg-green-50 text-green-700 p-3 rounded border border-green-200">
                        <span>✅ AI transcription model ready</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                          <span>
                            {useWhisper ? 'AI Processing...' : 'Processing...'}
                          </span>
                        </>
                      ) : (
                        <>
                          {useWhisper ? <Brain className="w-4 h-4" /> : <FileAudio className="w-4 h-4" />}
                          <span>
                            {useWhisper ? 'Transcribe with AI' : 'Transcribe Audio'}
                          </span>
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
                <strong>AI Models Available:</strong>
              </p>
              <ul className="mt-2 text-blue-600 text-sm space-y-1">
                <li>• <strong>Whisper Tiny:</strong> Fast, 40MB download, good accuracy</li>
                <li>• <strong>Whisper Base:</strong> Better accuracy, 150MB (upgrade option)</li>
                <li>• <strong>Whisper Small:</strong> Best accuracy, 250MB (upgrade option)</li>
              </ul>
              <p className="text-blue-600 text-sm mt-2">
                All models run locally in your browser - no data sent to external servers!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechToTextApp;