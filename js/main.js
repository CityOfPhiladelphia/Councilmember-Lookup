/*global history,council*/

$( "#lookup" ).submit(function( e ) {
  var searchBox = $('#address');
  var q = searchBox.val();
  e.preventDefault();
  searchBox.blur();
  history.pushState({q: q}, '', '?' + $.param({q: q}));
  view();
});

$(view);
window.onpopstate = view;

/* 1. On document load*/
function view () {
  if (!window.location.search) {
    // Front page
    $('#address').val('');
    $('#district').text('');
    $('#councilmember').text('');
    $('#atLarge').text('');
    return;
  }

  /* 1a. Check for pre-existing browser history state and create one if necessary (using search terms entered by user).  */
  if (!history.state) {
    var q = $.deparam(window.location.search.substr(1)).q;
    history.replaceState({q: q});
  }
  /* 1b. Populate search bar with search term from history state. */
  $('#address').val(history.state.q);
  /* 1c. Proceed with getting/displaying councilmember information */

  if ($('#address').val != ''){
    checkDistrict();
    getCouncilMember();
    
  }
  
}

/* 2. Check history for district, district number. Call API if no district is found */
function checkDistrict () {
  if (history.state.district || history.state.noDistrict) {
    renderDistrict();
  } else {
    $('#district').text('Loading...');
    $('#councilmember').text('');
    $('#atLarge').text('');
    getDistrict();
  }
}
/* 3. Call ULRS API for address information. Enter info into browser history state */
function getDistrict (cb) {
  $.getJSON("https://api.phila.gov/ulrs/v3/addresses/" + history.state.q + "/service-areas?format=json")
    .done(function (data) {
      if (!data.serviceAreaValues.length) {
        history.replaceState($.extend({noDistrict: true}, history.state), '');
        return renderDistrict();
      }
      var sa;
      for (var i = 0; i < data.serviceAreaValues.length; i++){
        sa = data.serviceAreaValues[i];
        if (sa.serviceAreaId == 'SA_PLANNING_2016Councilmanic'){
          history.replaceState($.extend({district: sa.value}, history.state), '');
          renderDistrict();
          getCouncilMember();
          return;
        }
      }
    })
    .fail(function (jqxhr, textStatus, err) {
      console.error(err);
      renderDistrict(err);
    });
}

/* Display District Number */
function renderDistrict () {
  var message;
  if (!history.state.district) message = 'No district found';
  else message = "You are in council district " + history.state.district;
  $('#district').text(message);
}

/* Check state for Councilmember */
function getCouncilMember () {
  if (!history.state.district) return;
  var member;
  for (var i = 0; i < council.length; i++){
    member = council[i];
    if (history.state.district === member.district) {
      renderCouncilMember(member);
      return;
    }
  }
}

/* Display Council Member */
function renderCouncilMember (member) {
  var memberEl = $("#councilmember");
  if (!member) {
    return memberEl.text('');
  }
  var memberName = "<u>Your councilmember</u><strong><br>" + member.name + '<br>' + member.address + '<br>' + member.phone + '<br></strong>';
  memberEl.html(memberName);
  $('#atlargelabel').show();
  getAtLarge();
}

/* Display Council Members At Large */
function getAtLarge () {
  $('#atLarge').html(council.map(function (member) {
    if (member.district === 'At-Large') return member.name + '<br>' + member.address + '<br>' + member.phone + '<br><br>';
    else return '';
  }));
}

function renderAtLarge() {
  $('#atLarge').html(council.map(function (member) {
    if (member.district === 'At-Large') return member.name + '<br>' + member.address + '<br>' + member.phone + '<br><br>';
    else return '';
  }));
}

