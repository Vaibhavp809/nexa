// Extension Translations - Local translations file similar to frontend
// This provides fast translations without API calls

const translations = {
    en: {
        bubble: {
            features: {
                summarize: 'Summarize',
                translate: 'Translate',
                quicknotes: 'Quick Notes',
                voicenotes: 'Voice Notes',
                voicesearch: 'Voice Search',
                tasks: 'Tasks',
                settings: 'Settings',
            },
            panels: {
                summarize: {
                    title: 'AI Chat & Summarizer',
                    placeholder: 'Paste text or select from page...',
                    button: 'Summarize',
                    summary: 'SUMMARY',
                },
                translate: {
                    title: 'Nexa Translate',
                    textMode: 'Text Mode',
                    voiceMode: 'Voice Mode',
                    sourceLanguage: 'Source Language',
                    targetLanguage: 'Target Language',
                    enterText: 'Enter text to translate...',
                    startListening: 'Start Listening',
                    stopListening: 'Stop Listening',
                    translate: 'Translate',
                    readOutput: 'Read Output',
                    translation: 'Translation',
                },
                quicknotes: {
                    title: 'Quick Notes',
                    noNotes: 'No notes yet',
                    addNote: 'Add Note',
                    delete: 'Delete',
                },
                voicenotes: {
                    title: 'Voice Notes',
                    record: 'Record',
                    stop: 'Stop',
                    save: 'Save',
                    play: 'Play',
                    pause: 'Pause',
                    noNotes: 'No voice notes yet',
                    speed: 'Speed',
                },
                voicesearch: {
                    title: 'Voice Search',
                    startListening: 'Start Listening',
                    stopListening: 'Stop Listening',
                    search: 'Search',
                    listening: 'Listening...',
                },
                tasks: {
                    title: 'Tasks & Reminders',
                    addTask: 'Add Task',
                    taskTitle: 'Task Title',
                    description: 'Description',
                    dueDate: 'Due Date',
                    save: 'Save',
                    cancel: 'Cancel',
                    noTasks: 'No tasks yet',
                    completed: 'Completed',
                    delete: 'Delete',
                },
                settings: {
                    title: 'Settings',
                },
            },
        },
        settings: {
            title: 'Settings',
            bubble: {
                title: 'Floating Bubble',
                enable: 'Enable Bubble',
                description: 'Changes will reload the page to apply.'
            },
            bubbleTheme: {
                title: 'Bubble Theme',
                chooseIcon: 'Choose your bubble icon:'
            },
            language: {
                title: 'Language',
                preferred: 'Preferred Language'
            },
            account: {
                title: 'Account',
                signOut: 'Sign Out'
            }
        },
        common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            loading: 'Loading...',
            logout: 'Logout'
        }
    },
    hi: {
        bubble: {
            features: {
                summarize: 'सारांश',
                translate: 'अनुवाद',
                quicknotes: 'त्वरित नोट्स',
                voicenotes: 'वॉइस नोट्स',
                voicesearch: 'वॉइस खोज',
                tasks: 'कार्य',
                settings: 'सेटिंग्स',
            },
            panels: {
                summarize: {
                    title: 'AI चैट और सारांशकर्ता',
                    placeholder: 'पाठ पेस्ट करें या पेज से चुनें...',
                    button: 'सारांश',
                    summary: 'सारांश',
                },
                translate: {
                    title: 'नेक्सा अनुवाद',
                    textMode: 'टेक्स्ट मोड',
                    voiceMode: 'वॉइस मोड',
                    sourceLanguage: 'स्रोत भाषा',
                    targetLanguage: 'लक्ष्य भाषा',
                    enterText: 'अनुवाद के लिए पाठ दर्ज करें...',
                    startListening: 'सुनना शुरू करें',
                    stopListening: 'सुनना बंद करें',
                    translate: 'अनुवाद करें',
                    readOutput: 'आउटपुट पढ़ें',
                    translation: 'अनुवाद',
                },
                quicknotes: {
                    title: 'त्वरित नोट्स',
                    noNotes: 'अभी तक कोई नोट्स नहीं',
                    addNote: 'नोट जोड़ें',
                    delete: 'हटाएं',
                },
                voicenotes: {
                    title: 'वॉइस नोट्स',
                    record: 'रिकॉर्ड',
                    stop: 'रोकें',
                    save: 'सहेजें',
                    play: 'चलाएं',
                    pause: 'रोकें',
                    noNotes: 'अभी तक कोई वॉइस नोट्स नहीं',
                    speed: 'गति',
                },
                voicesearch: {
                    title: 'वॉइस खोज',
                    startListening: 'सुनना शुरू करें',
                    stopListening: 'सुनना बंद करें',
                    search: 'खोजें',
                    listening: 'सुन रहे हैं...',
                },
                tasks: {
                    title: 'कार्य और अनुस्मारक',
                    addTask: 'कार्य जोड़ें',
                    taskTitle: 'कार्य शीर्षक',
                    description: 'विवरण',
                    dueDate: 'नियत तारीख',
                    save: 'सहेजें',
                    cancel: 'रद्द करें',
                    noTasks: 'अभी तक कोई कार्य नहीं',
                    completed: 'पूर्ण',
                    delete: 'हटाएं',
                },
                settings: {
                    title: 'सेटिंग्स',
                },
            },
        },
        settings: {
            title: 'सेटिंग्स',
            bubble: {
                title: 'फ्लोटिंग बबल',
                enable: 'बबल सक्षम करें',
                description: 'परिवर्तन लागू करने के लिए पृष्ठ पुनः लोड होगा।'
            },
            bubbleTheme: {
                title: 'बबल थीम',
                chooseIcon: 'अपना बबल आइकन चुनें:'
            },
            language: {
                title: 'भाषा',
                preferred: 'पसंदीदा भाषा'
            },
            account: {
                title: 'खाता',
                signOut: 'साइन आउट'
            }
        },
        common: {
            save: 'सहेजें',
            cancel: 'रद्द करें',
            delete: 'हटाएं',
            loading: 'लोड हो रहा है...',
            logout: 'लॉगआउट'
        }
    },
    mr: {
        bubble: {
            features: {
                summarize: 'सारांश',
                translate: 'भाषांतर',
                quicknotes: 'त्वरित नोट्स',
                voicenotes: 'व्हॉइस नोट्स',
                voicesearch: 'व्हॉइस शोध',
                tasks: 'कार्ये',
                settings: 'सेटिंग्ज',
            },
            panels: {
                summarize: {
                    title: 'AI चॅट आणि सारांशकर्ता',
                    placeholder: 'मजकूर पेस्ट करा किंवा पृष्ठावरून निवडा...',
                    button: 'सारांश',
                    summary: 'सारांश',
                },
                translate: {
                    title: 'नेक्सा भाषांतर',
                    textMode: 'मजकूर मोड',
                    voiceMode: 'व्हॉइस मोड',
                    sourceLanguage: 'स्रोत भाषा',
                    targetLanguage: 'लक्ष्य भाषा',
                    enterText: 'भाषांतरासाठी मजकूर प्रविष्ट करा...',
                    startListening: 'ऐकणे सुरू करा',
                    stopListening: 'ऐकणे थांबवा',
                    translate: 'भाषांतर करा',
                    readOutput: 'आउटपुट वाचा',
                    translation: 'भाषांतर',
                },
                quicknotes: {
                    title: 'त्वरित नोट्स',
                    noNotes: 'अद्याप नोट्स नाहीत',
                    addNote: 'नोट जोडा',
                    delete: 'हटवा',
                },
                voicenotes: {
                    title: 'व्हॉइस नोट्स',
                    record: 'रेकॉर्ड',
                    stop: 'थांबवा',
                    save: 'जतन करा',
                    play: 'प्ले',
                    pause: 'विराम',
                    noNotes: 'अद्याप व्हॉइस नोट्स नाहीत',
                    speed: 'गती',
                },
                voicesearch: {
                    title: 'व्हॉइस शोध',
                    startListening: 'ऐकणे सुरू करा',
                    stopListening: 'ऐकणे थांबवा',
                    search: 'शोधा',
                    listening: 'ऐकत आहे...',
                },
                tasks: {
                    title: 'कार्ये आणि आठवणी',
                    addTask: 'कार्य जोडा',
                    taskTitle: 'कार्य शीर्षक',
                    description: 'विवरण',
                    dueDate: 'नियत तारीख',
                    save: 'जतन करा',
                    cancel: 'रद्द करा',
                    noTasks: 'अद्याप कार्ये नाहीत',
                    completed: 'पूर्ण',
                    delete: 'हटवा',
                },
                settings: {
                    title: 'सेटिंग्ज',
                },
            },
        },
        settings: {
            title: 'सेटिंग्ज',
            bubble: {
                title: 'फ्लोटिंग बबल',
                enable: 'बबल सक्षम करा',
                description: 'बदल लागू करण्यासाठी पृष्ठ पुन्हा लोड होईल.'
            },
            bubbleTheme: {
                title: 'बबल थीम',
                chooseIcon: 'तुमचा बबल आयकॉन निवडा:'
            },
            language: {
                title: 'भाषा',
                preferred: 'पसंतीची भाषा'
            },
            account: {
                title: 'खाते',
                signOut: 'साइन आउट'
            }
        },
        common: {
            save: 'जतन करा',
            cancel: 'रद्द करा',
            delete: 'हटवा',
            loading: 'लोड होत आहे...',
            logout: 'लॉगआउट'
        }
    },
    kn: {
        bubble: {
            features: {
                summarize: 'ಸಾರಾಂಶ',
                translate: 'ಅನುವಾದ',
                quicknotes: 'ತ್ವರಿತ ಟಿಪ್ಪಣಿಗಳು',
                voicenotes: 'ವಾಯ್ಸ್ ಟಿಪ್ಪಣಿಗಳು',
                voicesearch: 'ವಾಯ್ಸ್ ಹುಡುಕಾಟ',
                tasks: 'ಕಾರ್ಯಗಳು',
                settings: 'ಸೆಟ್ಟಿಂಗ್ಗಳು',
            },
            panels: {
                summarize: {
                    title: 'AI ಚಾಟ್ ಮತ್ತು ಸಾರಾಂಶಕ',
                    placeholder: 'ಪಠ್ಯವನ್ನು ಅಂಟಿಸಿ ಅಥವಾ ಪುಟದಿಂದ ಆಯ್ಕೆಮಾಡಿ...',
                    button: 'ಸಾರಾಂಶ',
                    summary: 'ಸಾರಾಂಶ',
                },
                translate: {
                    title: 'ನೆಕ್ಸಾ ಅನುವಾದ',
                    textMode: 'ಪಠ್ಯ ಮೋಡ್',
                    voiceMode: 'ವಾಯ್ಸ್ ಮೋಡ್',
                    sourceLanguage: 'ಮೂಲ ಭಾಷೆ',
                    targetLanguage: 'ಗುರಿ ಭಾಷೆ',
                    enterText: 'ಅನುವಾದಿಸಲು ಪಠ್ಯವನ್ನು ನಮೂದಿಸಿ...',
                    startListening: 'ಕೇಳಲು ಪ್ರಾರಂಭಿಸಿ',
                    stopListening: 'ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
                    translate: 'ಅನುವಾದಿಸಿ',
                    readOutput: 'ಔಟ್ಪುಟ್ ಓದಿ',
                    translation: 'ಅನುವಾದ',
                },
                quicknotes: {
                    title: 'ತ್ವರಿತ ಟಿಪ್ಪಣಿಗಳು',
                    noNotes: 'ಇನ್ನೂ ಟಿಪ್ಪಣಿಗಳಿಲ್ಲ',
                    addNote: 'ಟಿಪ್ಪಣಿ ಸೇರಿಸಿ',
                    delete: 'ಅಳಿಸಿ',
                },
                voicenotes: {
                    title: 'ವಾಯ್ಸ್ ಟಿಪ್ಪಣಿಗಳು',
                    record: 'ರೆಕಾರ್ಡ್',
                    stop: 'ನಿಲ್ಲಿಸಿ',
                    save: 'ಉಳಿಸಿ',
                    play: 'ಪ್ಲೇ',
                    pause: 'ವಿರಾಮ',
                    noNotes: 'ಇನ್ನೂ ವಾಯ್ಸ್ ಟಿಪ್ಪಣಿಗಳಿಲ್ಲ',
                    speed: 'ವೇಗ',
                },
                voicesearch: {
                    title: 'ವಾಯ್ಸ್ ಹುಡುಕಾಟ',
                    startListening: 'ಕೇಳಲು ಪ್ರಾರಂಭಿಸಿ',
                    stopListening: 'ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
                    search: 'ಹುಡುಕಿ',
                    listening: 'ಕೇಳುತ್ತಿದೆ...',
                },
                tasks: {
                    title: 'ಕಾರ್ಯಗಳು ಮತ್ತು ಜ್ಞಾಪನೆಗಳು',
                    addTask: 'ಕಾರ್ಯ ಸೇರಿಸಿ',
                    taskTitle: 'ಕಾರ್ಯ ಶೀರ್ಷಿಕೆ',
                    description: 'ವಿವರಣೆ',
                    dueDate: 'ಬಾಕಿಯಿರುವ ದಿನಾಂಕ',
                    save: 'ಉಳಿಸಿ',
                    cancel: 'ರದ್ದುಮಾಡಿ',
                    noTasks: 'ಇನ್ನೂ ಕಾರ್ಯಗಳಿಲ್ಲ',
                    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
                    delete: 'ಅಳಿಸಿ',
                },
                settings: {
                    title: 'ಸೆಟ್ಟಿಂಗ್ಗಳು',
                },
            },
        },
        settings: {
            title: 'ಸೆಟ್ಟಿಂಗ್ಗಳು',
            bubble: {
                title: 'ತೇಲುವ ಬಬಲ್',
                enable: 'ಬಬಲ್ ಸಕ್ರಿಯಗೊಳಿಸಿ',
                description: 'ಬದಲಾವಣೆಗಳನ್ನು ಅನ್ವಯಿಸಲು ಪುಟವನ್ನು ಮರುಲೋಡ್ ಮಾಡಲಾಗುವುದು.'
            },
            bubbleTheme: {
                title: 'ಬಬಲ್ ಥೀಮ್',
                chooseIcon: 'ನಿಮ್ಮ ಬಬಲ್ ಐಕಾನ್ ಆಯ್ಕೆಮಾಡಿ:'
            },
            language: {
                title: 'ಭಾಷೆ',
                preferred: 'ಮುಖ್ಯ ಭಾಷೆ'
            },
            account: {
                title: 'ಖಾತೆ',
                signOut: 'ಸೈನ್ ಔಟ್'
            }
        },
        common: {
            save: 'ಉಳಿಸಿ',
            cancel: 'ರದ್ದುಮಾಡಿ',
            delete: 'ಅಳಿಸಿ',
            loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
            logout: 'ಲಾಗ್ ಔಟ್'
        }
    }
};

// Get translation by key
function getTranslation(lang, key) {
    const keys = key.split('.');
    let value = translations[lang] || translations['en'];
    
    for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
            // Fallback to English if translation not found
            value = translations['en'];
            for (const k2 of keys) {
                value = value?.[k2];
            }
            break;
        }
    }
    
    return value || key; // Return key if translation not found
}

// Export for use in side panels
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, getTranslation };
}
