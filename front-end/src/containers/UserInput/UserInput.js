import React, { useState, useEffect } from 'react';
import classes from './UserInput.module.css';
import useDebounce from '../Hooks/useDebounce';

// Redux
import { connect } from 'react-redux';
import * as actionTypes from '../../store/actions/actionTypes';
// Action creators
import searchTextAsync from '../../store/actions/searchText';
import updateSearchAsync from '../../store/actions/updateSearch';

// Helpers
import applyHighlight from '../../helper/applyHightlight';
import getSampleEssay from '../../helper/sampleEssay';
import AnchorLink from 'react-anchor-link-smooth-scroll';

// Material UI
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

const UserInput = props => {

    // Controls a snackbar that prompts a new user to click on 
    // a word in the sidebar to see its synonyms
    const [clickWordModal, setClickWordModal] = useState(false);

    // Is determined by localStorage, 
    const [userIsNew, setUserIsNew] = useState(false);



    // On mount: sets whether or not the user is new.

    useEffect(() => {
        const initialText = localStorage.getItem('text');
        if (!initialText) {
            setUserIsNew(true);
        };
    }, []);



    // text that updates after the user stops typing (1 second)
    // this is used to update search with updateSearchAsync()

    let debouncedText = useDebounce(props.text, 1000);

    useEffect(() => {
        if (debouncedText && props.numWords >= 200 && props.overused.length > 0) {
            props.onUpdateSearch(props.text, props.numWords, props.loadedSynonyms, props.ignoredWords);
        }
    }, [debouncedText]);



    // Updates overusedList based on change in ignored words

    useEffect(() => {
        if (props.overused.length > 0) {
            props.onUpdateSearch(props.text, props.numWords, props.loadedSynonyms, props.ignoredWords);
        }
    }, [props.ignoredWords]);

    

    // To reset overused if the user deletes their current essay.

    useEffect(() => {
        if (props.numWords === 0 && props.overused.length > 0) {
            props.onResetSearch();
        }
    }, [props.numWords]);



    // Determining border shadows dynamically based on dark mode

    const neuBorder = props.darkMode ? {
        main: {boxShadow: '-10px -10px 10px rgba(255, 255, 255, 0.012), 10px 10px 10px rgba(0, 0, 0, 0.12), inset 1px 1px 3px rgba(0, 0, 0, 0.15), inset -1px -1px 3px rgba(255, 255, 255, 0.02)'},
        secondary: {boxShadow: '-8px -8px 8px rgba(255, 255, 255, 0.012), 8px 8px 8px rgba(0, 0, 0, 0.12), inset 1px 1px 3px rgba(0, 0, 0, 0.15), inset -1px -1px 3px rgba(255, 255, 255, 0.02)'}
    }
    : {
        main: {boxShadow: '-10px -10px 8px rgba(255, 255, 255, 0.35), 10px 10px 8px rgba(0, 0, 0, 0.05), inset 1px 1px 3px rgba(0, 0, 0, 0.03), inset -1px -1px 3px rgba(255, 255, 255, 0.2)'},
        secondary: {boxShadow: '-8px -8px 8px rgba(255, 255, 255, 0.35), 8px 8px 8px rgba(0, 0, 0, 0.05), inset 1px 1px 3px rgba(0, 0, 0, 0.03), inset -1px -1px 3px rgba(255, 255, 255, 0.2)'}
    };



    const checkButtonClickedHandler = () => {
        if (props.overused.length === 0) {
            props.onSearchText(props.text, props.numWords);
            if (userIsNew) {
                setClickWordModal(true);
            }
        } else {
            props.onUpdateSearch(props.text, props.numWords, props.loadedSynonyms, props.ignoredWords);
        }
    }

    const wordClickedHandler = word => {
        const synonyms = props.loadedSynonyms[word];
        props.onSetInspect(word, synonyms); 
        window.scrollTo(0, 0);
    }

    return <div className={classes.UserInput} id="userinput">
        <div className={classes.TextFieldSynonymBox}>

        {props.overused.length > 0 && props.numWords >= 200 ? 

                <aside className={classes.SynonymLane}>

                    <div 
                    className={classes.SynonymBox}
                    style={{
                        color: props.pallete.userInputText,
                        ...neuBorder.secondary
                    }}>

                        <table className={classes.SynonymTable}>
                            <thead >
                                <tr style={{
                                    textAlign: 'center'
                                }}>
                                    <td>WORD</td>
                                    <td>FOUND</td>
                                    <td className={classes.SeverityHeader}>
                                        SCORE
                                    </td>
                                </tr>
                            </thead>
                            <br/>
                            <tbody>
                                {props.overused.map(element => {
                                    return <tr key={element.word}>
                                        <td 
                                        className={classes.NameFieldItem} 
                                        onClick={() => wordClickedHandler(element.word)}
                                        style={props.inspectedWord === element.word ? {opacity: '1', fontWeight: '500', letterSpacing: '-.1px', color: props.pallete.accentText} : null}>
                                            {element.word}
                                        </td>
                                        <td
                                        style ={{
                                            textAlign: "center"
                                        }}
                                        >{element.numFound}</td>
                                        <td
                                        style ={{
                                            textAlign: "center"
                                        }}
                                        >{Math.floor((element.numFound / props.numWords) / element.expectedFrequency)}</td>
                                    </tr>
                                })}
                            </tbody>
                        </table>

                        <div className={classes.Stats}>
                            <p className={classes.Stat}>{props.numWords} words</p>
                            <p className={classes.Stat}>{props.numChars} characters</p>
                        </div>

                        {props.loading ? 
                            <CircularProgress size={20} className={classes.Spinner} color="dark"/>
                        : null}
                        
                       
                    </div>
                </aside>
            : null}

            <div className={classes.TextFieldBox}
            style={{
                ...neuBorder.main
            }}>
                {props.inspectedWord && props.numWords >= 200 ?
                    <div className={classes.HighlightText}>
                            {applyHighlight(props.text, props.inspectedWord, {
                                color: props.pallete.userInputText,
                                backgroundColor: props.pallete.userInputTextHighlight,
                                transition: 'background-color 0.2s ease',
                                opacity: '.3'
                            })}
                    </div>
                : null}
                
                <TextareaAutosize
                spellCheck="false"
                placeholder="Paste your essay here"
                className={classes.TextField}
                maxLength="100000"
                value={props.text}
                style={{
                    color: props.pallete.userInputText,
                    zIndex: '5'
                }}
                autoFocus={true}
                onChange={event => props.onTextUpdated(event.target.value)}>
                </TextareaAutosize>
                
                {props.overused.length === 0 ?
                    <AnchorLink href="#userinput" offset="200">
                        <button className={classes.CheckButton}
                        onClick={checkButtonClickedHandler}
                        disabled={!props.changed || props.numWords < 200}>
                            CHECK
                        </button>
                    </AnchorLink>
                : null}
                

                {/* Displays with insufficient text */}
                {props.numWords < 200 ?
                    <div 
                    className={classes.WordCountWarningBox}
                    style={{
                        color: props.pallete.userInputText
                    }}>
                        <span>A minimum of 200 words required. </span>
                        <span className={classes.SampleEssayCTA} onClick={() => props.onTextUpdated(getSampleEssay())}>Try sample essay</span>
                    </div>
                : null}
            </div>
        </div>

        <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={clickWordModal}
        autoHideDuration={6000}
        onClose={() => setClickWordModal(false)}
        message="Click on a word to see its synonyms"
        action={
          <>
            <IconButton size="small" aria-label="close" color="inherit" onClick={() => setClickWordModal(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
        />
        
        <Snackbar
        anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
        }}
        open={props.ignoreModal}
        autoHideDuration={6000}
        onClose={props.onCloseIgnoreModal}
        message={`"` + props.lastIgnored + `"` + ' is ignored for this visit.'}
        action={
        <>
            <Button key="undo" color="secondary" size="small" onClick={props.onRemoveIgnore}>
            UNDO
            </Button>
            <IconButton size="small" aria-label="close" color="inherit" onClick={props.onCloseIgnoreModal}>
            <CloseIcon fontSize="small" />
            </IconButton>
        </>
        }
        />


    </div>
}

const mapStateToProps = state => {
    return {
        pallete: state.pallete.pallete,
        text: state.userInput.text,
        numWords: state.userInput.numWords,
        numChars: state.userInput.numChars,
        overused: state.userInput.overused,
        inspectedWord: state.inspect.word,
        loading: state.userInput.loading,
        changed: state.userInput.changed,
        numWords: state.userInput.numWords,
        loadedSynonyms: state.userInput.loadedSynonyms,
        darkMode: state.pallete.darkMode,
        ignoredWords: state.ignore.words,
        ignoreModal: state.ignore.ignoreModal,
        lastIgnored: state.ignore.lastIgnored
    }
}

const mapDispatchToProps = dispatch => {
    return {
        onTextUpdated: text => dispatch({type: actionTypes.UPDATE_TEXT, text: text}),
        onSearchText: (text, numWords) => dispatch(searchTextAsync(text, numWords)),
        onSetInspect: (word, synonyms) => dispatch({type: actionTypes.SET_INSPECT, word: word, synonyms: synonyms}),
        onUpdateSearch: (text, numWords, overusedList, ignoredWords) => dispatch(updateSearchAsync(text, numWords, overusedList, ignoredWords)),
        onResetSearch: () => dispatch({type: actionTypes.RESET_SEARCH}),
        onRemoveIgnore: () => dispatch({type: actionTypes.REMOVE_IGNORE}),
        onCloseIgnoreModal: () => dispatch({type: actionTypes.CLOSE_IGNORE_MODAL})
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserInput);
