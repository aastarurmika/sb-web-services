import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../configs/request.config'

import { logError } from '../utils/logger'

import { CONSTANTS } from '../utils/env'

export const customSignUp = Router()

const API_END_POINTS = {
  createUser: `${CONSTANTS.ES_BASE}`,
  sendOTP: `${CONSTANTS.MSG91BASE}/api/v5/otp`,
  resendOTP : `${CONSTANTS.MSG91BASE}/api/v5/otp/retry`,
  verifyOTP : `${CONSTANTS.MSG91BASE}/api/v5/otp/verify`
}


const msgKey = CONSTANTS.MSG91KEY;
//Routes
//create account

customSignUp.post('/registerUserWithEmail', async (req, res) => {
  try{
    const newUser = await createKCUser(req);
    if(newUser.data.errorMessage){
      res.status(500).send(newUser.data.errorMessage)
    } else
    res.status(200).send('Success');
  }
  catch(e){
    res.status(401).send(
      {
        error:`Error Creating User : ${e}`,
      }
    )
  }
})

customSignUp.post('/registerUserWithMobile',async (req,res) =>{
  const mobileNumber = req.body.mobileNumber;
  //generate otp
  await sendOTP(mobileNumber)
  res.status(200).send('Success')
  return
})

customSignUp.post('/verifyUserWithMobileNumber', async(req,res) => {
  //body mobileNumber, password/otp
  const otp = req.body.data.otp;
 const mobileNumber = req.body.mobileNumber;
  const verification = await verifyOTP(mobileNumber,otp);
  
  if(verification.type==="success"){
    try{
      const newUser = await createKCUser(req);
      if(newUser.data.errorMessage){
        res.status(500).send(newUser.data.errorMessage)
      } else
      res.status(200).send('Success');
    }
    catch(e){
      res.status(401).send(
        {
          error:`Error Creating User : ${e}`,
        }
      )
    }
    
  }
  else{
    res.status(401).send(
      {
        error:'Invalid Otp',
      }
    )
  }
})

//reset password otp
customSignUp.post('/resetPassword', async(req,res) => {
  const username = req.body.username;
  const userData = await getUser(username)
  //email or mobile
  if(userData){
    const type = emailOrMobile(username);
    if(type=="phone"){
      await sendOTP(username)
      res.status(200).send('Success')
    }
    else if(type=="email"){
      //triger email rest password
      await emailactionKC(userData[0].id,'resetPassword')
      res.status(200).send('Success')
    }
    else {
      res.status(401).send(
        {
          error:'Invalid Email/Mobile Number',
        }
      )
    }
  }
  else{
    res.status(401).send(
      {
        error:'User Not Found',
      }
    )
  }
})

customSignUp.post('/setPasswordWithOTP', async(req,res) => {
  const username = req.body.username;
 // const otp = req.body.otp;
  const password = req.body.password;
  const userData = await getUser(username)
  if(userData){
  //  const verification = await verifyOTP(username,otp);
    
    if(true){
    
        const userId = userData[0].id;
        const status = resetKCPassword(userId,password);
        res.status(200).send(status)
    }
    else {
      res.status(401).send(
        {
          error:'Invalid Otp',
        }
      )
    }
  }
 
})



export const emailOrMobile = function(value:string){
    let isValidEmail = emailValidator(value);
    if(isValidEmail)
    return 'email'
    else{
      let isValidMobile = mobileValidator(value);
      if(isValidMobile){
        return 'phone'
      }
    }
    return 'error'
}

const emailValidator = function(value:string) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
}
const mobileValidator = function(value:string){
    return /^([7-9][0-9]{9})$/.test(value)
}

export const sendOTP = async function(mobileNumber:string){
  try {
    mobileNumber = '91'+mobileNumber;
    const url = `${API_END_POINTS.sendOTP}?authkey=${msgKey}&template_id=${CONSTANTS.MSG91TEMPLATEID}&mobile=${mobileNumber}&invisible=1`;

    const response = await axios.get(url, axiosRequestConfig)
   
    return response;
  }
  catch(err){
    logError('MSG91 Service Error >', err)
    return 'Error';
  }
 
}

export const resendOTP = async function(mobileNumber:string){
  try {
    mobileNumber = '91'+mobileNumber;
    const url = `${API_END_POINTS.resendOTP}?authKey=${msgKey}&mobile=${mobileNumber}`;
    const response = await axios.get(url, axiosRequestConfig)
    return response;
  }
  catch(err){
    logError('MSG91 Service Error >', err)
    return 'Error';
  }
}

export const verifyOTP = async function(mobileNumber:string,otp:string){
  try {
    mobileNumber = '91'+mobileNumber;
    const url = `${API_END_POINTS.verifyOTP}?authkey=${msgKey}&mobile=${mobileNumber}&otp=${otp}`;
    const response = await axios.get(url, axiosRequestConfig)
    return response.data;
  }
  catch(err){
    logError('MSG91 Service Error >', err)
    return 'Error';
  }
}

export const getKCToken = async function(){
  
const url= `${CONSTANTS.HTTPS_HOST}/auth/realms/${CONSTANTS.KEYCLOAK_REALM}/protocol/openid-connect/token`;
const params = new URLSearchParams()
params.append('username',CONSTANTS.KEYCLOAK_ADMIN_USERNAME )
params.append('password',CONSTANTS.KEYCLOAK_ADMIN_PASSWORD )
params.append('client_id',"admin-cli" )
params.append('grant_type', "password")


const config = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
}

const resp = await axios.post(url,params,config);

return resp.data.access_token
     

 
}
// tslint:disable-next-line: no-any
export const createKCUser = async function(req:any){
  try {
    const token = await getKCToken();

    // tslint:disable-next-line: no-any
    const reqBody:any  = {
      "firstName":req.body.data.firstname,
      "lastName":req.body.data.lastname, 
      
      "enabled":"true", 
      "username":req.body.data.username,
      "credentials":[{
         "value":req.body.data.password,
         "type" : "password",
         "temporary" : false
   }]}
   if(req.body.type=="email"){
       reqBody.email =  req.body.data.email;
   }
   else {
     reqBody.email = `${req.body.data.username}@aastar.org`
     reqBody.emailVerified = true 
   }
 
   const url = `${CONSTANTS.HTTPS_HOST}/auth/admin/realms/${CONSTANTS.KEYCLOAK_REALM}/users`
   const headers = {
     "Content-Type":"application/json",
     "Authorization": `Bearer ${token}`
   }
  
   const resp =  await axios.post(url,reqBody, {
     headers:headers
   })
   
   return resp
  }
  catch(e){
    return e.response
  }
   
}

export const getUser = async function(username:string){
try {
  const url = `${CONSTANTS.HTTPS_HOST}/auth/admin/realms/${CONSTANTS.KEYCLOAK_REALM}/users?username=${username}`;
  const token = await getKCToken();
    const headers = {
      "Authorization": `Bearer ${token}`
    }
  const response = await axios.get(url,{headers:headers});
  return response.data;
}
catch(e){
  return e.response.data
}
  
}

export const resetKCPassword = async function(userId:string,password:string){
  try {
    const url = `${CONSTANTS.HTTPS_HOST}/auth/admin/realms/${CONSTANTS.KEYCLOAK_REALM}/users/${userId}/reset-password`;
    const body = {
      "value":password,
      type:"password",
      "temporary":false
    }
    const token = await getKCToken();
    const headers = {
      "Content-Type":"application/json",
      "Authorization": `Bearer ${token}`
    }
    const resp = await axios.put(url,body,{headers})
    return resp.data;
  }
  catch(e){
    return e.response.data
  }
  
}

export const emailactionKC = async function(userId:string,action:string){
  const url = `${CONSTANTS.HTTPS_HOST}/auth/admin/realms/${CONSTANTS.KEYCLOAK_REALM}/users/${userId}/execute-actions-email`;
  const token = await getKCToken();
  const headers = {
    "Authorization": `Bearer ${token}`
  }
  let body:any= [];
 if(action=="verifyEmail")
 {
   body = ["VERIFY_EMAIL"]
 }
 else if(action=="resetPassword"){
   body = ["UPDATE_PASSWORD"]
 }
 try { 
  const resp = await axios.put(url,body,{headers})
  return resp.data;
 }
 catch(e){
   return e.response
 }
 
}

