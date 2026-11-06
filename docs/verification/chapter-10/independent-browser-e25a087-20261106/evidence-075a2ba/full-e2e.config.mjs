export default {
 testDir: '/workspace/chapter10-independent-20261106/candidate-075a2ba/tests',
 outputDir: '/workspace/chapter10-independent-20261106/candidate-evidence-075a2ba/full-e2e-output',
 reporter: [['list'],['json',{outputFile:'/workspace/chapter10-independent-20261106/candidate-evidence-075a2ba/full-e2e.json'}]],
 workers: 4,
 use: {baseURL:'http://127.0.0.1:4173/gemini-toranomaki/'},
 webServer: {command:'npm run preview -- --port 4173',cwd:'/workspace/chapter10-independent-20261106/candidate-075a2ba',url:'http://127.0.0.1:4173/gemini-toranomaki/',reuseExistingServer:false},
 projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'webkit',use:{browserName:'webkit',launchOptions:{executablePath:'/workspace/chapter10-independent-20261106/webkit-launch.sh'}}}]
};
