import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import $ from 'jquery'; //npm install jquery --save
import { Col, Fa } from "mdbreact"; //https://mdbootstrap.com/docs/react/getting-started/quick-start/ for mdb bootstrap //npm install --save mdbreact
window.jQuery = window.$ = $;

class App extends Component {

constructor(props) {
    super(props);

    // searchWords was the input from the user
    // suggsKeywords was the keywords of the suggs
    // suggs were the array from the google response
    // showSuggs means we should show the suggs if the searchWords was the same as the suggsKeywords
    this.state = {searchWords:"", suggsKeywords:"", suggs:[], showSuggs:false};
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
  }

  componentWillUnmout() {
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
  }

  handleMouseDown(event) {
    let x = $(document).scrollLeft() + event.clientX; // event.offsetX
    let y = $(document).scrollTop() + event.clientY; // event.offsetY
    
    // did not click on the search input or the suggestion list
    if (this.state.showSuggestions && !this.checkXYInElement(x, y, '.searcher-suggs') && !this.checkXYInElement(x, y, '.searcher-input')) {
        this.setState({showSuggestions: false});
      }
  }

    checkXYInElement(x, y, className) {
    let elem = $(className);
    if (elem.length == 0) {
      return false;
    }

    let rect = {x: elem.offset().left, y: elem.offset().top, w: elem.outerWidth(), h: elem.outerHeight()};

    if (x < rect.x || y < rect.y || x > (rect.x + rect.w) || y > (rect.y + rect.h)) {
      return false;      
    }

    return true;
  }

  checkSuggsKeywords(keywords) {
    if (this.state.suggsKeywords == encodeURIComponent(keywords.toLowerCase())) {
      return true;
    }

    return false;
  }

  requestSuggestions(keywords) {
    // current suggs was request with the input keywords
    // no need to send again
    if (this.checkSuggsKeywords(keywords)) {
      return;
    }

    // empty keywords just reset the suggsKeywords and suggs
    if (keywords.length == 0) {
      this.setState({suggsKeywords:"", suggs:[]});
      return;
    }

    let urlKeywords = encodeURIComponent(keywords.toLowerCase());
    this.setState({suggsKeywords:urlKeywords, suggs:[]});
    let url = 'https://suggestqueries.google.com/complete/search?output=chrome&q='+urlKeywords;
    //let url = 'http://localhost:5000/search?q='+urlKeywords;

    // use JSONP (issue: http://security.stackexchange.com/questions/23438/security-risks-with-jsonp/23439#23439)
    // just for CORS trick
    $.ajax({
      url: url,
      dataType: 'jsonp',
      type: 'GET',
      success: function(data, textStatus, jqXHR) {
        // data[0] was the keywords to search
        // data[1] was the array of the google suggestion keywords
        //console.log(data);
        if (this.checkSuggsKeywords(data[0])) {
          this.setState({suggs:data[1]});
        }
      }.bind(this)

    });
    
  }

  handleSearcherInputChange(event) {
    let newSearchWords = event.target.value;
    this.setState({searchWords: newSearchWords, showSuggestions: true});

    this.requestSuggestions(newSearchWords);
  }

  // handle user click on the list of the suggestions
  handleClickSuggetionsKeywords(event) {
    this.setState({searchWords:event.target.textContent, showSuggestions: false});
    this.requestSuggestions(event.target.textContent);
  }

  // handle the onFocus event of the search input
  handleFocusSearcherInput(event) {
    this.setState({showSuggestions: true});
  }

  // handel the key down event of the search input
  handleSearcherInputKeyDown(event) {
    if (this.state.showSuggestions) {
      // use keyboard to select the suggesions
      this.handleSelectSuggestions(event);
    } else {
      // just show the suggestions list
      this.setState({showSuggestions: true});
    }
  }

  // use use keyboards to select the suggestions
  handleSelectSuggestions(event) {
    let li = $('.searcher-suggs-word.selected');
    // 40 => down, 38 => up
    if (event.keyCode == 40 || event.keyCode == 38) {
      event.preventDefault();
      if (li.length == 0) {
        $('.searcher-suggs-word:first-child').toggleClass('selected');
      } else if (event.keyCode == 40) {
        li.removeClass('selected');
        li.next().toggleClass('selected');
      } else {
        li.removeClass('selected');
        li.prev().toggleClass('selected');
      }
    } else {
      // 13 => enter
      if (event.keyCode == 13) {
        event.preventDefault();

        if (li.length > 0) {
          this.setState({searchWords:li.text(), showSuggestions: false});
          this.requestSuggestions(li.text());
        } else {
          this.setState({showSuggestions: false});
        }
      }
    }
  }

  // hover event on the suggestions list
  handleHoverSearcherSuggestions(event) {
    $('.searcher-suggs-word.selected').removeClass('selected');
    $('.searcher-suggs-word:hover').addClass('selected');
  }

  render() {
    let suggestions = null;
    // we should also check the input search was the same as the suggetions keywords
    if (this.state.showSuggestions && this.checkSuggsKeywords(this.state.searchWords)) {
      suggestions = this.state.suggs.map(function(value, index) {
        return (<li key={index} className="searcher-suggs-word" onClick={this.handleClickSuggetionsKeywords.bind(this)} onMouseOver={this.handleHoverSearcherSuggestions.bind(this)}>{value}</li>);
      }.bind(this));
    }

     return (
      <Col md="6">
        <div className="input-group md-form form-sm form-1 pl-0">
          <div className="input-group-prepend">
            <span className="input-group-text purple lighten-3" id="basic-text1" >
              <Fa className="text-white" icon="search"/>
            </span>
          </div>
          <div>
          <input
            className="form-control my-0 py-1 searcher-input"
            type="text"
            id="searcher"
            onChange={this.handleSearcherInputChange.bind(this)}
            onFocus={this.handleFocusSearcherInput.bind(this)}
            onKeyDown={this.handleSearcherInputKeyDown.bind(this)} 
            value={this.state.searchWords}
            placeholder="Search"
            aria-label="Search"
          />

          <ul className="searcher-suggs">
          {suggestions}
          </ul>

          </div>
        </div>
      </Col>
    );
  }
}

export default App;
