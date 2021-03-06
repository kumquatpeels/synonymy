

// The whole point of this action creator is the same as searchText, only to avoid needlessly reaching out 
// to the api for synonyms when it isn't needed.

import * as actionTypes from './actionTypes';
import wf from 'word-freq';
import usage from 'norvig-frequencies';
import axios from '../../axios';
import {isValidWord} from '../../helper/isValidWord';

const getExpectedFrequency = word => {
    word = word.toUpperCase();
    const rank = usage.indexOf(word) + 1
    // Rough yet surprisingly accurate formula to estimate 
    // frequency of the word used in everyday language (Zipf distribution)
    return (.0714 / rank)
}

const updateTextAsync = (text, numWords, loadedSynonyms, ignoredWords) => {

    return dispatch => {
        dispatch(searchTextStart());

        localStorage.setItem('text', text);

        if (text.length > 0) {
            // All usages of non-stop words found in the text.
            const allWords = wf.freq(text, true, false);

            let newOverusedList = [];

            Object.keys(allWords).forEach(word => {

                const numFound = allWords[word];

                if (numFound >= 3 && !ignoredWords.includes(word)) {

                    if (isValidWord(word)) {
    
                        const expectedFrequency = getExpectedFrequency(word);
    
                        if (expectedFrequency) {
                            const overusedMultiplier = Math.floor((numFound / numWords) / expectedFrequency);
        
                            if (overusedMultiplier > 5) {
                                newOverusedList.push({
                                    word: word,
                                    multiplier: overusedMultiplier,
                                    numFound: numFound,
                                    expectedFrequency: expectedFrequency
                                })
                            }
                        }
                    }
                }
            });

            // Descending order by multiplier
            newOverusedList.sort((a, b) => b.multiplier - a.multiplier);
            // Limit to ten words (Most overused)
            newOverusedList = newOverusedList.slice(0, 10);

            let wordsWithoutSynonyms = [];

            newOverusedList.forEach(element => {
                if (Object.keys(loadedSynonyms).includes(element.word)) {
                    // If synonym has already been fetched
                    element.synonyms = loadedSynonyms[element.word];
                } else {
                    // If synonym hasn't been fetched yet
                    wordsWithoutSynonyms.push(element);
                }
            });

            if (wordsWithoutSynonyms.length > 0) {
                axios.post('/synonyms/', {
                    list: wordsWithoutSynonyms
                })
                .then(res => {
                    // Adding synonyms for new overused words
                    loadedSynonyms = {...loadedSynonyms, ...res.data}
                    dispatch(searchTextSuccess(newOverusedList, loadedSynonyms));
                })
                .catch(err => {
                    console.log(err);
                });
            } else {
                dispatch(searchTextSuccess(newOverusedList, loadedSynonyms));
            }
        }
    }
}

const searchTextStart = () => {
    return {type: actionTypes.SEARCH_TEXT_START}
}

const searchTextSuccess = (overusedList, loadedSynonyms) => {
    return {type: actionTypes.SEARCH_TEXT_SUCCESS, overused: overusedList, loadedSynonyms: loadedSynonyms}
}

const searchTextFailure = () => {
    return {type: actionTypes.SEARCH_TEXT_FAILURE}
}

export default updateTextAsync;