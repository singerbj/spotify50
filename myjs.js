(function() {
  var clientId = '9928a183577247faa3dc93fd3cfe4cf1';
  var scopes = "playlist-read-private%20playlist-read-collaborative%20user-library-read%20user-top-read";
  var params = {};
  var paramsStrings = window.location.hash.replace('#', '').split('&');
  paramsStrings.forEach(function(paramString) {
    var keyValueArray = paramString.split('=');
    params[keyValueArray[0]] = keyValueArray[1];
  });
  window.location.hash = '';

  if (!params.access_token) {
    window.location = 'https://accounts.spotify.com/authorize?client_id=' + clientId + '&response_type=token&redirect_uri=http:%2F%2F' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + pathname + '%2F&scope=' + scopes;
  } else {
    var handleError = function(resp) {
      console.log(resp.error);
      console.log(resp.message);
    };

    var getTopTracksForUser = function() {
      return $.ajax({
        type: 'GET',
        url: 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term',
        dataType: 'json',
        beforeSend: function(xhr) {
          xhr.setRequestHeader('Authorization', 'Bearer ' + params.access_token);
        }
      });
    };

    var getFeaturesForTracks = function(idsString) {
      return $.ajax({
        type: 'GET',
        url: 'https://api.spotify.com/v1/audio-features/?ids=' + idsString,
        dataType: 'json',
        beforeSend: function(xhr) {
          xhr.setRequestHeader('Authorization', 'Bearer ' + params.access_token);
        }
      });
    };

    var appendTracksToDom = function(tracks) {
      $('.loading').remove();
      var container = $('.container');
      tracks.forEach(function(track, index) {
        var artists = track.artists.map(function(artist) {
          return artist.name;
        }).join(', ');
        container.append('<div class="item-container"><img class="art" src="' + track.album.images[1].url + '"></img><div class="info-container"><div class="track-name">' + track.name + '</div><div class="track-artist">' + artists + '</div></div><div class="track-dance">' + Math.floor(track.analysis.danceability * 100) + '%</div>');
        //  + ' (' + Math.floor(track.analysis.danceability * 100) + '% Danceable)</div>');
      });
      $('body').append(container);
    };

    getTopTracksForUser().always(function(resp) {
      if (resp.error) {
        handleError(resp);
        return;
      }

      var ids = resp.items.map(function(track) {
        return track.id;
      }).join(',');
      getFeaturesForTracks(ids).always(function(resp2) {
        if (resp2.error) {
          handleError(resp2);
          return;
        }
        var avgObj;
        resp2.audio_features.forEach(function(af, index) {
          resp.items[index].analysis = af;
          //acousticness,danceability,energy,instrumentalness,liveness,loudness,speechiness,tempo,valence
          if (avgObj) {
            avgObj.acousticness += af.acousticness; //https://developer.spotify.com/web-api/get-several-audio-features/
            avgObj.danceability += af.danceability;
            avgObj.energy += af.energy;
            avgObj.instrumentalness += af.instrumentalness;
            avgObj.liveness += af.liveness;
            avgObj.loudness += af.loudness;
            avgObj.speechiness += af.speechiness;
            avgObj.tempo += af.tempo;
            avgObj.valence += af.valence;
          } else {
            avgObj = {};
            avgObj.acousticness = af.acousticness;
            avgObj.danceability = af.danceability;
            avgObj.energy = af.energy;
            avgObj.instrumentalness = af.instrumentalness;
            avgObj.liveness = af.liveness;
            avgObj.loudness = af.loudness;
            avgObj.speechiness = af.speechiness;
            avgObj.tempo = af.tempo;
            avgObj.valence = af.valence;
          }
        });

        var k;
        for (k in avgObj) {
          if (avgObj[k] !== undefined) {
            avgObj[k] = avgObj[k] / resp.items.length;
          }
        }

        console.log(resp.items);
        console.log(avgObj);

        // resp.items.sort(function compareNumbers(a, b) {
        //   return b.analysis.danceability - a.analysis.danceability;
        // });
        appendTracksToDom(resp.items);

      });
    });

  }
}());
