<script>
    //export let name = 'World';
    import WorldMap from './WorldMap.svelte';
    let daysCount;
    import '../global.css';
    import { playing } from './store.js';
  
    let playPauseText = 'Play';
  
    $: playPauseText = $playing ? 'Pause' : 'Play';
  
    // When calling togglePlay, you will update the store directly
    function togglePlay() {
      playing.set(!$playing);
    }
  
  </script>
  
  
  
  <main>
    <h1>Wenbin WorldWide INC. COVID Investigation</h1>
    <p>A story of how covid took over the world and changed everything, here is the dataset used <a href="https://www.kaggle.com/datasets/imdevskp/corona-virus-report?resource=download">Covid Data</a>.</p>
    <input type="range" min="0" max="daysCount" value="0" id="timeSlider" step="1">
    <!-- Add an input to control the speed -->
    <label for="speedRange">Speed:</label>
    <input type="range" id="speedRange" min="100" max="2000" value="1000"
      on:change="{(e) => WorldMap.changeSpeed(e.target.value)}">
  
    <label for="timeSlider" id="sliderLabel">Date: </label>
  
    <WorldMap/>
  </main>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Oswald:wght@200..700&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');
  
    main {
        text-align: center;
        padding: 1em;
        width: 100%;
        margin: 0 auto;
        font-family: 'Copperplate', Sans-serif; /* Change the font-family as needed */
    }
  
    h1 {
        color: #4b0000;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 3000;
        font-family: 'Times', Sans-serif; /* Change the font-family as needed */
    }
    p {
        font-family: 'Luminari', sans-serif; /* Change the font-family as needed */
        font-size: 1.3em; /* Adjust the size as needed */
    }
  
    #timeSlider {
        background: linear-gradient(to right, #ddd 0%, #ddd 100%); 
        width: 50%; 
        border-radius: 10px; 
    }
  
    #timeSlider::-moz-range-track {
        width: 100%;
        height: 8px;
        background: rgb(34, 24, 24);
        border-radius: 10px;
    }
    #timeSlider::-webkit-slider-thumb {
        transition: background-color 0.3s ease-in-out;
        transform: translate3d(0, 0, 0);
    }
    #timeSlider::-moz-range-thumb {
          transition: background-color 0.3s ease-in-out;
        transform: translate3d(0, 0, 0);
    }
    #sliderLabel {
        display: block;
        margin-top: 10px; 
        font-size: 1.1em;
        color: #080808;
    }
  </style>