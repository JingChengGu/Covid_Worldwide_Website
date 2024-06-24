<script>
  //export let name = 'World';
  import WorldMap from './WorldMap.svelte';
  let daysCount;
  import '../global.css';
  import { playing } from './store.js';

  let playPauseText = 'Play';
  let showTitlePage = true;
  let showEndPage = false;

  function goToMap() {
    showTitlePage = false;
  }
  function goToEndPage() {
    showEndPage = true;
  }

  $: playPauseText = $playing ? 'Pause' : 'Play';

  // When calling togglePlay, you will update the store directly
  function togglePlay() {
    playing.set(!$playing);
  }

</script>

{#if showTitlePage}
  <main class="title-page">
    <h2>In just a matter of months, an infectious disease changed the world entirely. How did COVID-19, the coronavirus, weave its way across continents? Join us on a journey to unravel the story of how a global pandemic took hold starting in 2020.</h2>
    <p>click through to know how it happened</p>
    <button on:click={goToMap}>Explore the Map</button>
  </main>
{:else if showEndPage}
  <main class="end-page">
    <h2>Reflecting on the Pandemic</h2>
    <p>While the growth of COVID-19 was exponential in overall cases, not every country experienced this. For example, China had the most cases at the beginning, but their lockdown mandates stopped the spread of COVID-19 very effectively, unlike the US or Brazil.</p>
    <button on:click={() => showEndPage = false}>Back to Map</button>
  </main>
{:else}
  <main>
    <h1>WorldWide COVID Investigation</h1>
    <p>By: Ethan Deng, Wenbin Jiang, Jason Gu</p>
    <p>Explore how covid took over the world and changed everything, here is the dataset used <a href="https://www.kaggle.com/datasets/imdevskp/corona-virus-report?resource=download">Covid Data</a>.</p>
    <input type="range" min="0" max="daysCount" value="0" id="timeSlider" step="1">
    <label for="timeSlider" id="sliderLabel">Date: </label>
    <WorldMap on:endPage={goToEndPage}/>
  </main>
{/if}



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

.title-page {
  text-align: center;
  padding: 2em; /* Existing top and bottom padding */
  padding-left: 5%; /* Increase left padding */
  padding-right: 5%; /* Increase right padding */
  max-width: 1200px; /* Maximum width */
  margin-left: auto; /* Centering horizontally - left */
  margin-right: auto; /* Centering horizontally - right */
}

.title-page h2 {
  font-size: 3em; /* Adjust as needed */
  margin-bottom: 4em;
  word-wrap: break-word; /* Ensure text breaks nicely */
}

.title-page p {
  font-size: 1.7em; /* Adjust as needed */
  margin-bottom: 1em;
}

.title-page button {
  font-size: 1.2em;
  padding: 0.5em 1em;
  cursor: pointer;
  background-color: #4b0000;
  color: white;
  border: none;
  border-radius: 50px;
  transition: background-color 0.3s;
}

.title-page button:hover {
  background-color: #690000;
}

.end-page {
text-align: center;
padding: 2em;
max-width: 1200px;
margin: 0 auto;
}

.end-page h2 {
  font-size: 2.5em;
  margin-bottom: 1em;
}

.end-page p {
  font-size: 1.5em;
  margin-bottom: 2em;
}

.end-page button {
  font-size: 1.2em;
  padding: 0.5em 1em;
  cursor: pointer;
  background-color: #4b0000;
  color: white;
  border: none;
  border-radius: 50px;
  transition: background-color 0.3s;
}

.end-page button:hover {
  background-color: #690000;
}
</style>
