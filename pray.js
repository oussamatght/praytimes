  let cities = [

      "Adrar", "Ain Defla", "Ain Temouchent", "Algiers", "Annaba", "Batna", "Bechar", "Bejaia", "Beni Abbes", "Biskra",
      "Blida", "Bouira", "Boumerdes", "Bordj Badji Mokhtar", "Bordj Bou Arreridj", "Chlef", "Constantine", "Djanet", "Djelfa", "El Bayadh",
      "El Menia", "El Oued", "El Tarf", "El M'Ghair", "Ghardaia", "Guelma", "Illizi", "In Guezzam", "In Salah", "Jijel",
      "Khenchela", "Laghouat", "Mascara", "Medea", "Mila", "Mostaganem", "Msila", "Naama", "Oran", "Ouargla",
      "Ouled Djellal", "Oum El Bouaghi", "Relizane", "Saida", "Setif", "Sidi Bel Abbes", "Skikda", "Souk Ahras", "Tamanrasset", "Tebessa",
      "Tiaret", "Timimoun", "Tipaza", "Tindouf", "Tissemsilt", "Tizi Ouzou", "Tlemcen", "Touggourt"


  ]
  for (city of cities) {
      const content = `
     <option value="${city}">${city}</option>`
      document.getElementById("mySelect").innerHTML += content

  }


  function getTime(cityname) {
      let param = {

          city: cityname,
          country: "DZ",
          method: 19

      }

      axios.get('https://api.aladhan.com/v1/timingsByCity', {
              params: param
          })
          .then(function(response) {
              const data = response.data.data.timings;
              const date = response.data.data.date.readable;
              document.querySelector("#date").innerHTML = date;
              console.log(date);
              document.querySelector(".fajr").innerHTML = data.Fajr;
              document.querySelector(".dhuhr").innerHTML = data.Dhuhr;
              document.querySelector(".sunrise").innerHTML = data.Sunrise;
              document.querySelector(".asr").innerHTML = data.Asr;
              document.querySelector(".moghrib").innerHTML = data.Maghrib;
              document.querySelector(".icha").innerHTML = data.Isha;



          })
          .catch(function(error) {
              console.log(error.response ? (error.response.data || error.message) : error.message);
          });

  }
  document.getElementById("mySelect").addEventListener("change", function() {
      console.log(this.value);
      document.getElementById("time").innerHTML = this.value;
      getTime(this.value);
  })