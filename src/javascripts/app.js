/*
app.js

This code was created for prototyping purposes, it is not suitable for a production release.

Author: Matt Lough & Tinus Wagner
3months.com
*/

// The user object where we store results
var user_obj = {};

// Import all JS here
// This file serves as the entry point for our webpack config
var $ = require('jquery');
var requirement_names = require('../../dist/requirements.json');
var myJson = require('../../dist/regulation.json');
require('bootstrap-loader');
require('../../src/stylesheets/styles.scss');
require('../../src/javascripts/bootstrap-switch.min.js');
require('../../src/stylesheets/bootstrap-switch.min.scss');

// require('../../node_modules/web3/dist/web3.js');
require('web3');
require('../../src/javascripts/uport-connect.js');
require('../../src/javascripts/uport.js');

import { Connect, SimpleSigner } from 'uport-connect';

function uportError(msg) {
  $('#uportError').text(msg);
  $('#uportError').removeClass('hidden');
}

const uportConnect = function() {
  if ($(this).hasClass('btn-success')) {
    return false;
  }
  const uport = new Connect('Lab+ Prototype', {
    clientId: '2oiUayrjWPXQd5bgGQd43CsYy1iNZGQxmsd',
    signer: SimpleSigner('2440cb4fc4b5e3b74fe6b4e79890b622fc23c0d5bd281d9f7b26790341453374'),
    network: 'rinkeby'
    //public key 0x040951f3c3f6919b3238768ad12fd24bff02b75d66c42632a377ff7f9553847dc6837e9e09625ad137b5fd6732331cd4ab9a4bd26d929a3e6a8170227975a0cdf8
  });

  // Request credentials to login
  uport.requestCredentials({
    requested: ['name', 'phone', 'country', 'nz_resident', 'image'],
    notifications: true // We want this if we want to recieve credentials
  })
  .then(function(credentials) {
    // Do something
    console.log('Received credentials', credentials);
    // Attest specific credentials
    if (typeof credentials.nz_resident == 'undefined') {
      $('#uportModal').modal('show');
      $('#uportModal').on('click', 'button.save', function() {
        var nz_resident = $('#uport_resident').val();
        if (nz_resident == '') {
          uportError('You need to provide an answer for every question');
        } else {
          uport.attestCredentials({
            sub: credentials.address,
            claim: {
              nz_resident: nz_resident,
            },
            exp: new Date().getTime() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
          });
          uportConnected(nz_resident, credentials);
        }
      });
    } else {
      uportConnected(credentials.nz_resident, credentials);
    }
  },
  function(error) {
    console.log(error);
    $('#debugPanel').text(error);
    $('#uportError').removeClass('hidden');
  });
};

function uportConnected(nz_resident, credentials) {
  $('#uportModal').modal('hide');
  $('#uport-connect').text('uPort Connected');
  $('#uport-connect').removeClass('btn-info');
  $('#uport-connect').addClass('btn-success');

  // Load User Image
  console.log(credentials);
  if (typeof credentials.image != 'undefined' && typeof credentials.image.contentUrl != 'undefined') {
    var image_url = 'https://ipfs.io' + credentials.image.contentUrl;
    $('#uport_img').attr('src', image_url);
    $('#uport_img').removeClass('hidden');
  }

  // Load user object
  var nz_resident_answer = 'No';
  if (['yes', 'y', '1', 'true'].includes(nz_resident.toLowerCase()))
    {nz_resident_answer = 'Yes';}
  user_obj['citizenOrResident?'] = nz_resident_answer;
  user_obj['proofOfIdentity?'] = 'Yes';
  user_obj['livingInNZ?'] = (credentials.country == 'NZ') ? 'Yes' : 'No';

  // Change hero text
  $('h1.hero').first().text('What can I help you with, '+credentials.name.substr(0,5)+'?');

  // Change anonymous toggle
  $('.bootstrap-switch-handle-on').text(credentials.name.substr(0,5));
  $("[name='setting-anonymous']").bootstrapSwitch('state', true, true);

  $('#input input[type="checkbox"]').attr('checked', 'checked');
  $('#input input[type="checkbox"]').trigger('change');
}

$('#uport-connect').on('click', uportConnect);

function userObjectModalInit() {
  $('#debugModal').on('hidden.bs.modal', function(event) {
    updateCards();
  });

  $('#debugModal').on('show.bs.modal', function(event) {
    $('.user-obj tbody').html('');
    $.each(user_obj, function(key, value) {
      var view_data = {
        requirement_name: requirement_names[key],
        requirement_id: key,
        value1_class: value == 'Yes' ? 'selected' : '',
        value2_class: value == 'No' ? 'selected' : ''
      };
      var row = Mustache.to_html($('#userObjRowTpl').html(), view_data);
      $('.user-obj tbody').append(row);
    });
  });

  $('#debugModal').on('click', '.requirement_row button', function() {
    var requirement_id = $(this).closest('.requirement_row').attr('data-requirement-id');
    var answer_chosen = $(this).text();
    user_obj[requirement_id] = answer_chosen;
    $(this).closest('.requirement_row').find('button').removeClass('selected');
    $(this).addClass('selected');
  });
}

function benefitApplyModalInit() {
  $('#applyModal').on('show.bs.modal', function(event) {
    var all_benefits = $('.panel-heading-bizRule.green').length;
    var random = Math.floor(Math.random() * 3);
    $('.panel-heading-bizRule').each(function(counter, val) {
      if ($(this).hasClass('green')) {
        // We grab a random requirement from the business rule
        var random_requirement = $(this).parent().find('.requirement').eq(random).text();
        var view_data = {
          bizRuleName: $(this).find('.panel-title').text(),
          requirement: random_requirement
        };
        // If there is more than one benefit displayed
        // We append it to the error div to mock a data mismatch
        if (counter == all_benefits - 1 && all_benefits > 2) {
          var row = Mustache.to_html($('#applyRowErrorTpl').html(), view_data);
        } else {
          var row = Mustache.to_html($('#applyRowTpl').html(), view_data);
        }
        $('.user-apply tbody').append(row);
      }
    });
  });

  $('#applyModal').on('hidden.bs.modal', function(event) {
    $('.user-apply tbody').html('');
  });

  $('.user-apply').on('click', '.user-obj-apply', function() {
    $(this).toggleClass('animate-apply');
  });

  $('.user-apply').on('click', '.user-obj-correct', function() {
    $(this).toggleClass('animate-correct');
  });

  $('.user-apply-all').on('click', function() {
    if ($(this).hasClass('animate-apply')) {
      $(this).removeClass('animate-apply');
      $('.user-obj-apply').each(function() {
        $(this).removeClass('animate-apply');
      });
    } else {
      $(this).addClass('animate-apply');
      $('.user-obj-apply').each(function() {
        $(this).addClass('animate-apply');
      });
    }
  });
}

function questionsInit() {
  // This event is fired when you click Yes/No for any question
  $('#criteria1').on('click', '#question_buttons button', function() {
    var question_id = $(this).closest('.question').attr('data-question-id');
    if ($('.event-container-binary').length){
      setValue(question_id, $(this));
    } else {
     if ($(this).hasClass('btn-warning')){
      //  If user selects contact ird button we select yes button after a delay
      // fake API call
      var default_button = $('.btn-success');
       $(this).addClass('animate-correct');
       $(this).find('button').addClass('animate-correct');
       window.setTimeout(function() {
         setValue(question_id, default_button);
       }, 4000);
     } else {
       setValue(question_id, $(this));
     }
    }
  });
}

$(document).ready(function() {
  $("[name='setting-anonymous']").bootstrapSwitch();
  userObjectModalInit();
  benefitApplyModalInit();
  questionsInit();
  $('.closeAlert').on('click', function() {
    $(this).closest('.alert').addClass('hidden');
  });
});

function setValue(question_id, button){
  var answer_chosen = $(button).text();
  user_obj[question_id] = answer_chosen;
  $('#question_buttons').removeClass('slide-in');
  $('#question_buttons').addClass('slide-out');
  $('#question_buttons').on('animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd', function(e) {
    askQuestion();
    updateCards();
    $(this).off(e);
  });
}


function sortDivs(){
  $('.biz-rule-card').each(function(){
    var bizCard = $(this);
    if (bizCard.find('.red').length > 0){
      $('#fails').append(bizCard);
    }
  });
}

function getObjects(obj, key, val) {
  var objects = [];
  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] == 'object') {
      objects = objects.concat(getObjects(obj[i], key, val));
    } else if (i == key && obj[key] == val) {
      objects.push(obj);
    }
  }
  return objects;
}

// Recursively loop through JSON file
function createBizRuleCards(obj) {
  var counter = 0;
  for (var rule_num in obj) {
    var business_rule = obj[rule_num];

    var rule_id = business_rule.name + counter;
    createRulePanel(business_rule, rule_id);

    for (var requirement_name in business_rule.requirements) {
      if (business_rule.requirements.hasOwnProperty(requirement_name)) {
        var requirement = business_rule.requirements[requirement_name];
        createChildren(requirement_name, requirement, rule_id);
      }
    }
    counter++;
  }
}

function createChildren(requirement_name, requirement_value, rule_panel) {
  createRequirementPanel(requirement_name, requirement_value, rule_panel);
  if (typeof requirement_value == 'object' && requirement_value !== null) {
    for (var child in requirement_value) {
      if (requirement_value.hasOwnProperty(child)) {
        createChildren(child, requirement_value[child], getValidId(rule_panel + requirement_name));
      }
    }
  }
}

// Create a new div for each business Rule
function createRulePanel(rule, id) {
  var text = rule.name;
  var view_data = {
    text: text,
    id: id,
    title: returnTitle(text),
    type: rule.category
  };
  var template = $('#bizRuleCardTpl').html();
  $('#list').append(Mustache.to_html(template, view_data));
}

// Get an ID which could be a valid HTML ID
function getValidId(id) {
  return id.replace(/\?/, '');
}

// Create a new panel for each requirement
function createRequirementPanel(requirement_name, requirement_value, rule_id) {
  var parent_panel = document.getElementById(rule_id);

  var view_data = {};
  view_data.requirement_name = requirement_names[requirement_name];
  if (typeof requirement_value !== 'object' && requirement_value !== null) {
    view_data.requirement_value = requirement_value;
    view_data.requirement_data_attr = requirement_name;
    var template = $('#requirementTpl').html();
  } else {
    view_data.id = getValidId(rule_id + requirement_name);
    var template = $('#benefitPanelTpl').html();
  }
  $(parent_panel).append(Mustache.to_html(template, view_data));
}

// Split our json titles into individual words
function returnTitle(text) {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function updateCards() {
  removeChecks();
  tickRequirements();
  countRequirements();
  sortDivs();
}

function removeChecks() {
  $('.checked').remove();
  $('.unchecked').remove();
  $('.green').removeClass('green');
  $('.red').removeClass('red');
  $('.orange').removeClass('orange');
}

// Render business rules specific to life event clicked
var lifeEventClicked = function() {
  var eventType = $(this).attr('data-event-type');
  if ($(this).is(':checked')) {
    createBizRuleCards(getObjects(myJson, 'category', eventType));
  } else {
    $('[data-event-type="' + eventType + '"].biz-rule-card').remove();
  }
  askQuestion();
  updateCards();
};

$('#fancy-checkbox-immigration, #fancy-checkbox-retired, #fancy-checkbox-health, #fancy-checkbox-childcare').change(
  lifeEventClicked
);

function returnTopRequirement() {
  var requirements_array = [];
  // Gather all visible requirements text from DOM and push to array
  $('p.requirement').each(function(i, obj) {
    requirements_array.push($(this).data('requirement'));
  });
  if (requirements_array.length) {
    return findMostCommonRequirement(requirements_array);
  } else {
    return 'error';
  }
}

function findMostCommonRequirement(array) {
  var ranked_values_object = {};
  // Loop through array to determine how often a value is repeated
  // Then rank them
  array.forEach(function(x) {
    ranked_values_object[x] = (ranked_values_object[x] || 0) + 1;
  });

  // If user has no object filtered_result_keys = ranked_values_object
  var filtered_result_keys = ranked_values_object;

  // If user has object, initialise two objects to compare and filter matches
  var unique_questions_keys = Object.keys(ranked_values_object);
  var user_answers_keys = Object.keys(user_obj);

  // we compare the ranked benefits with the user_obj
  // If we find a match (user has already answered that question)
  // We delete that value from ranked_values_object
  if (user_answers_keys.length) {
    unique_questions_keys.forEach(function(key) {
      user_answers_keys.forEach(function(key2) {
        if (key === key2) {
          delete ranked_values_object[key2];
        }
      });
    });
  }

  // loop through and return the value that is repeated most
  var top_result = Object.keys(ranked_values_object).reduce(function(a, b) {
    return ranked_values_object[a] > ranked_values_object[b] ? a : b;
  }, 0);
  return top_result;
}

function askQuestion() {
  var top_result = returnTopRequirement();
  if ($('.life-events input:checkbox:checked').length > 0) {
    var result_options = determineResultOptions(top_result);
    // top_result == 0 if there are no more questions
    if (top_result === 0) {
      $('#criteria1').html('');
      renderApplyAll();
    } else {
      renderQuestion(requirement_names[top_result], top_result, result_options);
    }
  } else {
    $('#criteria1').html('');
  }
}

function renderQuestion(question_text, key, options) {
  var view_data = {
    question_text: question_text,
    question_id: key,
    value1: options[0],
    value2: options[1],
    value3: 'Validate with respective agency'
  };
  var accept_test = 'assessment';
  if (question_text.indexOf(accept_test) >= 0){
    var template = $('#questionMultiTpl').html();
  } else {
    var template = $('#questionTpl').html();
  }
  $('#criteria1').html(Mustache.to_html(template, view_data));
}

function renderApplyAll() {
  var template = $('#applyAllTpl').html();
  $('#criteria1').html(Mustache.to_html(template));
}

function countRequirements() {
  $('.biz-rule-card').each(function showRequirementCount(i, card) {
    var count_direct_children = $(card).find('.requirement-panel > .requirement > .checked').length;
    var count_nested_panels = $(card).find('.requirement-panel > .requirement > .panel-heading > .checked').length;
    var view_data = {
      id: $(card).attr('id'),
      // Count top level requirements
      count: $(card).find('.requirement-panel > .requirement').length,
      checked: count_direct_children + count_nested_panels
    };
    var template = $('#requirementsNumTpl').html();
    $(card).find('.card-preview').html('');
    $(card).find('.card-preview').append(Mustache.to_html(template, view_data));
  });
}

function tickRequirements() {
  for (var user_question in user_obj) {
    // Find each element that matches user question
    $("[data-requirement='" + user_question + "']").each(function() {
      var user_answer = user_obj[user_question];
      var question_answer = $(this).children().text();
      // If user answer matches question requirement
      if ($(this).find('.material-icons').length === 0) {
        if (answerToBool(user_answer) == answerToBool(question_answer)) {
          $(this).append('<i class="material-icons checked"></i>');
          $(this).addClass('green');
        } else {
          $(this).append('<i class="material-icons unchecked"></i>');
          $(this).addClass('red');
        }
      }
      tickIfAllChildrenTicked($(this));
      tickTopLevelRequirements($(this));
    });
  }
}

function tickIfAllChildrenTicked(item) {
  var all_criteria = item.closest('.panel').find('p').length;
  var checked_criteria = item.closest('.panel').find('i.checked').length;
  var checked_inner_panels = item.find('.panel > .panel-heading > .checked').length;

  var failed_criteria = item.closest('.panel').find('i.unchecked').length;
  var parent_panel_header = item.closest('.panel').find('.panel-heading');

  if (checked_criteria == all_criteria) {
    if (parent_panel_header.find('.checked').length === 0) {
      parent_panel_header.append('<i class="material-icons checked"></i>');
      parent_panel_header.addClass('green');
    }
  }

  if (failed_criteria > 0) {
    if (parent_panel_header.find('.unchecked').length === 0) {
      parent_panel_header.addClass('red');
    }
  }
}

function tickTopLevelRequirements(item) {
  $('.biz-rule-card').each(function() {
    var children = $(this).find('.panel-body').children();
    var checked_children = children.find('.checked').length;
    var failed_children = children.find('.unchecked').length;
    var all_children = children.length;
    var parent_panel_BizRule = $(this).find('.panel-heading-bizRule');
    if (checked_children == all_children) {
      if (parent_panel_BizRule.find('.checked').length === 0) {
        parent_panel_BizRule.addClass('green');
      }
    }
    if (failed_children > 0) {
      if (parent_panel_BizRule.find('.unchecked').length === 0) {
        parent_panel_BizRule.addClass('red');
      }
    }
    if (checked_children >= 1 && checked_children < all_children && failed_children == 0) {
      parent_panel_BizRule.addClass('orange');
    }
  });
}

// Used to convert 'truthy' values to an actual boolean
function answerToBool(string) {
  switch (string.toLowerCase()) {
    case 'yes':
    case 'true':
    case true:
      return true;
    case 'no':
    case 'false':
    case false:
      return false;
    default:
      return false;
  }
}

function determineResultOptions(top_result) {
  return ['Yes', 'No'];
}
