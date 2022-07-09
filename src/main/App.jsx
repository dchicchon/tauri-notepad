
import React, { useState, useEffect, useRef } from 'react'
import { appWindow } from '@tauri-apps/api/window'
import { FONT_COLOR, FONT_SIZE, BACKGROUND_COLOR, STORE_NAME } from '../utils/keys';
import { Store } from 'tauri-plugin-store-api';
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api';
import './App.css'
import { getKeyVal } from '../utils';

const selectedWindow = appWindow.label;
const windowMap = {
  [selectedWindow]: appWindow
}

const store = new Store(STORE_NAME);

const setTitle = (title) => {
  windowMap[selectedWindow].setTitle(title)
}

function App() {
  const [ypadding, setYPadding] = useState(25);
  const [xpadding, setXPadding] = useState(25);
  const [fontSize, setFontSize] = useState(25);
  const [backgroundColor, setBackgroundColor] = useState('#282c34');
  const [fontColor, setFontColor] = useState('white');
  const [currentFile, setCurrentFile] = useState({ path: null, name: 'Untitled' });
  const [text, setText] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);


  // setting cursor for input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setSelectionRange(cursor, cursor);
    }
  }, [inputRef, text])

  // watching app state changes, setting initial settings
  useEffect(() => {
    async function init() {
      setTitle("Untitled")
      // get preferences from store
      let fontSize = await getKeyVal(FONT_SIZE);
      let fontColor = await getKeyVal(FONT_COLOR);
      let backgroundColor = await getKeyVal(BACKGROUND_COLOR);

      console.log('FontSize:', fontSize);
      console.log('FontColor:', fontColor);
      console.log('BackgroundColor:', backgroundColor);

      if (fontSize) setFontSize(fontSize);
      if (fontColor) setFontColor(fontColor);
      if (backgroundColor) setBackgroundColor(backgroundColor);

      const unlisten = await listen('state_change', async (msg) => {
        console.log('Retrieved a state change');
        console.log(msg.payload);
        if (!msg.payload) return;
        if (msg.payload.text) {
          console.log('updating text')
          updateText({
            text: msg.payload.text
          });
        }
        if (msg.payload.name) {
          let newFile = {
            path: msg.payload.path,
            name: msg.payload.name
          }
          updateFile(newFile);
        }
        if (msg.payload.setting) {
          switch (msg.payload.setting) {
            case FONT_SIZE:
              let fontSize = await getKeyVal(FONT_SIZE)
              setFontSize(fontSize);
              break;
            case FONT_COLOR:
              let fontColor = await getKeyVal(FONT_COLOR)
              setFontColor(fontColor);
              break;
            case BACKGROUND_COLOR:
              let backgroundColor = await getKeyVal(BACKGROUND_COLOR)
              setBackgroundColor(backgroundColor);
              break;
          }
          // get the name of setting, retrieve the key from store
        }
        console.log(msg.payload);
      })
      return unlisten;
    }
    init();
  }, [])

  const updateText = ({ text, event }) => {
    if (event) {
      setCursor(event.target.selectionStart)
    }
    setText(text);
    invoke('db_insert', {
      key: 'text',
      value: text,
    })
      .catch(err => {
        console.log('error');
        console.log(err);
      })
  }
  const updateFile = async (file) => {
    invoke('db_insert', {
      key: 'file',
      value: file.path,
    }).then(response => {
      setCurrentFile(file);
      setTitle(file.name)
    })
      .catch(err => {
        console.log('error');
        console.log(err);
      })
  }

  return (
    <textarea
      ref={inputRef}
      className='paper'
      style={{
        color: fontColor,
        backgroundColor,
        fontSize: `${fontSize}px`,
        padding: `${ypadding}px ${xpadding}px`,
      }}
      value={text}
      onChange={(e) => updateText({
        text: e.target.value,
        event: e
      })}
      autoFocus={true}
    />
  )
}

export default App