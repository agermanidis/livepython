import React, {Component} from 'react'
import jq from 'jquery'

import SyntaxHighlighter from 'react-syntax-highlighter'
import { tomorrowNight } from 'react-syntax-highlighter/dist/styles'

tomorrowNight.hljs.background = 'none'
tomorrowNight.hljs.padding = 0

class CodeView extends Component {
  constructor() {
    super();
    this.state = {
      activity: null,
      intervalId: null
    };
  }

  scrollToSelected() {
    try {
      jq("body").animate({ 
        scrollTop: jq(".selected").offset().top - 500 
      }, 750);
    } catch (e) {
    }
  }

  componentDidMount() {
    this.scrollToSelected();
  }

  componentDidUpdate () {
    this.scrollToSelected();
  }

  componentWillReceiveProps(props) {
    var activity = JSON.parse(JSON.stringify(this.state.activity)) || {};

    if (!hasOwnProperty.call(activity, props.filename)) {
      activity[props.filename] = {}
    }

    activity[props.filename][props.lineno - 1] = Date.now();

    this.setState({ activity });
  }

  render() {
    if (!this.state.activity) return "";
    if (!this.state.activity[this.props.filename]) return "";
    if (!this.props.source) return "";
    var lines = this.props.source.split("\n");
    var lineEls = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line.length) line = "\n";
      var isExceptionLine = false;
      var cs = "line";
      var exceptionMessage;
      if (this.props.exception) {
        var exception = this.props.exception;
        if (i === exception.lineno - 1) {
          isExceptionLine = true;
          cs += " exception";
          exceptionMessage = " " + exception.type + ": " + exception.message;
        }
      } else if (
        i === this.props.lineno - 1 &&
        this.props.state !== "finished"
      ) {
        cs += " selected";
      }
      const lastActive = this.state.activity[this.props.filename][i] || 0
      const opacity = 1 - Math.min(1, (Date.now() - lastActive)/1000)
      var el = (
        <div
          key={i}
          className={cs}
          style={{
            backgroundColor: `rgba(39, 136, 101, ${opacity})`
          }}
        >
          <p key={i} className="line-number">
            {i + 1}
          </p>
          <SyntaxHighlighter language="python" style={tomorrowNight}>
            {line}
          </SyntaxHighlighter>
          {isExceptionLine && (
            <pre id="exception-message">{exceptionMessage}</pre>
          )}
          {"\n"}
        </div>
      );
      lineEls.push(el);
    }
    return (
      <div id="code-view">
        <div id="source">
          <div id="code-area">{lineEls}</div>
        </div>
      </div>
    );
  }
}

export default CodeView