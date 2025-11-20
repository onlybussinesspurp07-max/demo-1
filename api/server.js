const express = require("express");
const path = require("path");
const fs = require('fs');
const { MongoClient } = require("mongodb");

require("dotenv").config(); // Need???

const app = express();


// cache on server
let cachedClient = null;
let cachedDb = null;
// async function to avoid reconnecting every request. uses cache.
async function connectDB() {

    if(cachedDb){
        return cachedDb;
    }

    const client = new MongoClient(process.env.MONGO_URI);
    cachedClient = await client.connect();
    cachedDb = cachedClient.db("feedbackDB");

    return cachedDb;
}

/// transporter
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});



// Maybe make it all dynamic :)
const BRANCH_DATA_PATH = path.join(__dirname,'data', "branch.json");
const BRANCH_AND_TEACHER_PATH = path.join(__dirname, 'data', "branchAndTeacher.json");

app.use("/static", express.static(path.join(__dirname, '../public/static')));
app.use("/templates", express.static(path.join(__dirname, "../public/templates")));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); /////////////////////////////////// added


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/templates/index.html'));
});

app.get("/student", (req, res) =>{
    res.sendFile(path.join(__dirname, "../public/templates/student.html"));
});

app.get("/select", (req, res) =>{
    res.sendFile(path.join(__dirname, "../public/templates/select.html"));
});

app.get("/select_teacher", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/templates/select_teacher.html"));
});

app.get("/administrative", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/templates/administrative.html"));
});

app.get("/feedback_ques", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/templates/feedback_ques.html"));
});

app.get("/student_registration", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/templates/studentregistration.html"));
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/templates','profile.html'));
});

app.get("/success", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/templates", "success.html"));
});

app.get('/help', (req, res)=>{
    res.sendFile(path.join(__dirname, "../public/templates/help.html"));
});

app.get("/after_login_admin",(req, res)=>{
    res.sendFile(path.join(__dirname, "../public/templates/after_login_admin.html"));
});

///////////////////////////////////////
app.get("/getBranchAverages", async (req, res) => {
    try {
        const branch = req.query.branch; // e.g. SEAIML

        const db = await connectDB();
        const col = db.collection("feedBackAnswers"); 

        // Assuming only 1 document stores everything
        const data = await col.findOne({});
        if (!data || !data.answers || !data.answers[branch]) {
            return res.status(404).json({ success: false, message: "Branch not found" });
        }

        const branchData = data.answers[branch];  
        const teachers = Object.values(branchData);

        const totalQuestions = teachers[0].answers.length; // 10
        const sums = Array(totalQuestions).fill(0);

        teachers.forEach(teacher => {
            teacher.answers.forEach((ans, idx) => {
                sums[idx] += ans;
            });
        });

        const averages = sums.map(sum => sum / teachers.length);

        res.json({
            success: true,
            branch,
            averages
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

////////////////////////////////////////

app.post('/login', async (req, res) => {
    const { prn, password } = req.body;

    const db = await connectDB();
    const col = db.collection("LoginInfo");
    // check if bros is actually there
    const user = await col.findOne({ prn: prn });

    if(!user){
        return res.status(404).json({ message: "User does not exist" });
    }
    // they may be there but is the password right?
    if(user.password !== password){
        return res.status(401).json({ message: "Wrong Password" });
    }

    res.json({ message: "success" }); 
});

app.post("/send-data", async (req, res) => {
    try{
        const answerData = req.body;

        const db = await connectDB();
        const col = db.collection("feedBackAnswers");

        const result = await col.insertOne({ answers: answerData }); // answerData is a list
        
        res.json({ status: "success" });

    }
    catch(err){
        console.error("Something went wrong while storing data: ", err);
        res.json({ status: "Failed Sending Data" });
    }
});

app.post("/registration_data", async (req, res) => {
  try {
    const { prn, password, email, surveyFilled } = req.body;

    const db = await connectDB();
    const col = db.collection("LoginInfo");

    // checking wether user already exists or not
    const existing_email = await col.findOne({ email: email });
    if(existing_email){
        return res.status(409).json({ message: "Email already taken"}); // actually it's user with email already exists.
    }

    const existing_prn = await col.findOne({ prn: prn });
    if(existing_prn){
        return res.status(409).json({ message: "User with prn already exist" })
    }
    const result = await col.insertOne({
        prn,
        password,
        email,
        surveyFilled
    });
    res.status(200).json({ message: "success" })

  } catch (err) {
    console.error("Error in /registration_data:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/branch", (req, res) => {

    try {
        const year = req.query.year;
        const data = JSON.parse(fs.readFileSync(BRANCH_DATA_PATH, 'utf-8')); // No db changes are needed here :D

        if(year){
            const yearData = data.find((item) => item.year === year);
            if (yearData) return res.json(yearData.branch);
            else return res.status(404).json({ error: "Year not found" });
        }

        const branchs = data[0].branch;
        res.json(branchs);
    }
    catch (err){
        console.error("Error reading branches: ", err);
        res.status(500).json({error: "Internal server error"});
    }

});

// Static data so don't need to put it in db. But if admin 
// can change system is to be deployed, maybe move it to db?
app.get("/dyTeach", (req, res) => {
    
    try {
        const code = req.query.code;
        const data = JSON.parse(fs.readFileSync(BRANCH_AND_TEACHER_PATH, "utf-8")); // change for dbase //////////////////////////////////////////////////

        const found = data.find((obj) => Object.keys(obj)[0] === code);

        if(found){
            const teacherList = found[code];
            return res.json(teacherList);
        }
        else {
            return res.status(404).json({ error: "Teacher list not found "});
        }
    }
    catch(err){
        console.error("Error reading teacher List: ", err);
        res.status(500).json({ error: "Server error" });
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// OTP registration and verification logic --->
/* What and how it does->
 * User will receive otp
 * It will be valid until five minutes.
 * User can request `resend otp`. when done, old otp will be invalidated
 * and new otp can be used instead, which will be valid for 5 minutes again.
 * After five failed attempts, user should be unable to try for another 5 minutes  */
// OTP registration and verification logic (Upstash REST version)
// Requirements: npm install @upstash/redis
// Make sure process.env.UPSTASH_REDIS_REST_URL and process.env.UPSTASH_REDIS_REST_TOKEN are set

const { Redis } = require("@upstash/redis");

// initialize Upstash REST Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// CONFIG
const OTP_TTL_SECONDS = 300;       // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_MIN_SECONDS = 30;     // 30 second cooldown
const MAX_SENDS_PER_SESSION = 5;   // max OTP sends allowed per OTP session
const LOCKOUT_SECONDS = 600;       // 10 minute lockout

// KEYS
const keyOTP = (email) => `otp:code:${email}`;
const keyAttempts = (email) => `otp:attempts:${email}`;
const keyLastSent = (email) => `otp:lastSent:${email}`;   // stores timestamp (ms), TTL = RESEND_MIN_SECONDS
const keySendCount = (email) => `otp:sendcount:${email}`; // counter for #sends in current OTP session, TTL = OTP_TTL_SECONDS
const keyLock = (email) => `otp:lock:${email}`;           // lockout flag (set when too many verifications)

// Helper: generate 6-digit OTP as string (preserves leading zeros)
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * SEND OTP
 * - checks lockout
 * - enforces resend cooldown via lastSent
 * - enforces max sends per OTP session
 * - generates OTP, atomically sets otp, lastSent, increments sendCount, resets attempts
 * - sends email via transporter
 */
app.post("/send-email-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  const nowMs = Date.now();

  try {
    // 1) blocked by lockout?
    const locked = await redis.get(keyLock(email));
    if (locked) {
      return res.status(429).json({ success: false, message: "Too many failed attempts. Try again later." });
    }

    // 2) resend cooldown via lastSent
    const lastSentRaw = await redis.get(keyLastSent(email));
    if (lastSentRaw) {
      const lastSentMs = parseInt(lastSentRaw, 10);
      const elapsedMs = nowMs - lastSentMs;
      if (elapsedMs < RESEND_MIN_SECONDS * 1000) {
        const waitS = Math.ceil((RESEND_MIN_SECONDS * 1000 - elapsedMs) / 1000);
        return res.status(429).json({ success: false, message: `Please wait ${waitS}s before requesting a new OTP.` });
      }
      // else proceed
    }

    // 3) enforce max sends per session
    const sendCountKey = keySendCount(email);
    const sendCountRaw = await redis.get(sendCountKey);
    const sendCount = sendCountRaw ? parseInt(sendCountRaw, 10) : 0;
    if (sendCount >= MAX_SENDS_PER_SESSION) {
      return res.status(429).json({ success: false, message: `Maximum OTP requests (${MAX_SENDS_PER_SESSION}) reached. Please try again later.` });
    }

    // 4) generate OTP
    const otp = generateOtp();

    // 5) atomically set keys for this new OTP session:
    //    - set otp (ex OTP_TTL_SECONDS)
    //    - set lastSent (store ms string, ex RESEND_MIN_SECONDS)
    //    - incr sendCount and set its TTL to OTP_TTL_SECONDS (so the session resets after OTP expiry)
    //    - delete attempts to reset verification attempts
    //
    // Upstash REST supports multi() for atomic behavior
    const multi = redis.multi();
    multi.set(keyOTP(email), otp, { ex: OTP_TTL_SECONDS });
    multi.set(keyLastSent(email), String(nowMs), { ex: RESEND_MIN_SECONDS });
    multi.incr(sendCountKey);
    multi.expire(sendCountKey, OTP_TTL_SECONDS);
    multi.del(keyAttempts(email));
    await multi.exec();

    // send mail (assumes transporter is configured elsewhere)
    await transporter.sendMail({
      from: '"Feedbackform" <feedbackform366@gmail.com>',
      to: email,
      subject: "Your OTP Code for Feedback Registration",
      text: `Your OTP is: ${otp}`
    });

    return res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    console.error("send-email-otp error:", err && err.message ? err.message : err);
    // send concise error to client
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

/**
 * VERIFY OTP
 * - checks lockout
 * - checks OTP exists
 * - increments attempt count (first attempt sets TTL to remaining OTP TTL approx)
 * - if attempts >= MAX_VERIFY_ATTEMPTS -> delete OTP/session keys & set lock
 * - if OTP matches -> cleanup keys and accept
 */
app.post("/verify-email-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

  try {
    // 1) check lockout first
    const locked = await redis.get(keyLock(email));
    if (locked) {
      return res.status(429).json({ success: false, message: "Too many failed attempts. Try again later." });
    }

    // 2) check OTP exists
    const storedOtp = await redis.get(keyOTP(email));
    if (!storedOtp) {
      return res.status(400).json({ success: false, message: "OTP expired or not found" });
    }

    // 3) increment verify attempts
    const attemptsKey = keyAttempts(email);
    const attempts = await redis.incr(attemptsKey);

    if (attempts === 1) {
      // set attempts TTL so attempts counter disappears when OTP expires (approx)
      // Try to set it to OTP_TTL_SECONDS; if OTP had less TTL remaining, this is still safe (slightly longer)
      await redis.expire(attemptsKey, OTP_TTL_SECONDS);
    }

    // 4) if attempts exceed max -> revoke OTP and set lock
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      // Delete OTP, attempts, lastSent, sendcount and set lock with TTL = LOCKOUT_SECONDS
      const m = redis.multi();
      m.del(keyOTP(email), attemptsKey, keyLastSent(email), keySendCount(email));
      m.set(keyLock(email), "1", { ex: LOCKOUT_SECONDS });
      await m.exec();

      return res.status(429).json({ success: false, message: `Too many attempts. Locked for ${Math.floor(LOCKOUT_SECONDS / 60)} minutes.` });
    }

    // 5) check OTP value
    if (String(otp) !== String(storedOtp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // 6) success -> cleanup all keys for this email (accept)
    await redis.del(keyOTP(email), attemptsKey, keyLastSent(email), keySendCount(email), keyLock(email));

    return res.json({ success: true, message: "Email Verified Successfully!" });

  } catch (err) {
    console.error("verify-email-otp error:", err && err.message ? err.message : err);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
});



////////////////////////////////////////////////////////////////////////////////////////////////////

/// Sending branch details of student to backend
app.post("/field_details", async (req, res) => {
    try{
        const { prn, year, branch } = req.body;
        const yearCode = year + ' ' + branch;

        const db = await connectDB();
        const col = db.collection("LoginInfo");
        
        const result = await col.updateOne(
            { prn: prn },
            { $set: { yearCode: yearCode } }
        );
        if(result.matchedCount === 0){
            return res.status(404).json( {message: "User not found" });
        }

        res.json({ message: "field updated successfully" });
    }
    catch (err){
        console.error("Error in updating user data: ", err);
        res.status(500).json({ message: "Internal server error" });
    }
})

// give it the yearCode
app.get("/post_yearCode", async (req, res) => {
    try{
        const prn = req.query.prn;

        const db = await connectDB();
        const col = db.collection("LoginInfo");

        const user = await col.findOne({ prn: prn });

        if(!user) return res.status(404).json({ message: "Couldn't the user to retrieve yearCode" });
        
        res.json( {yearCode: user.yearCode} ); //user.yearCode is a string.
    }
    catch(err){
        console.log("Database connection error while retreiving yearCode: ", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
////////////////////////////// check

app.post("/updateSurveyFlag", async (req, res) => {
    try{
        const {prn, surveyFilled} = req.body;

        const db = await connectDB();
        const col = db.collection("LoginInfo");

        const user = await col.findOne({ prn: prn });
        if(!user) return res.status(404).json({ message: "Couldn't find user to setup flag" });
        
        const result = await col.updateOne(
            { prn: prn },
            { $set: { surveyFilled: surveyFilled } }
        );

        if(result.matchedCount === 0){
            return res.status(404).json( {message: "User not found" });
        }

        res.json({ message: "field updated successfully" });
    }
    catch (err){
        console.error("Error in updating user data: ", err);
        res.status(500).json({ message: "Internal server error" });
    }  
});

app.get("/checkSurveyFlag", async (req, res) => {
    try{
        const prn = req.query.prn;

        const db = await connectDB();
        const col = db.collection("LoginInfo");

        const user = await col.findOne({ prn: prn });
        if(!user) return res.status(404).json({ success: false, message: "User not found"});

        return res.json({ success: true, surveyFilled: user.surveyFilled });

    }
    catch (err){
        console.error("Error in database while checking the flag: ", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
////////////////////////// check
module.exports = app;