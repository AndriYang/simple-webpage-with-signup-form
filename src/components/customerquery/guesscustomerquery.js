import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createTicket }  from '../../store/actions/ticketActions'
import { Redirect } from 'react-router-dom'
import {Widget, addResponseMessage, addUserMessage, dropMessages} from 'react-chat-widget';
import {CometChat} from '@cometchat-pro/chat';
import config from '../../config/real-time-chat-config';
import 'react-chat-widget/lib/styles.css';
import Drawer from 'react-drag-drawer'
import {storage,database,auth} from '../../config/firebaseConfig'
import { firestoreConnect } from 'react-redux-firebase'
import FileUploader from "react-firebase-file-uploader";
import firebase from "firebase";

const agentUID = config.agentUID;
const CUSTOMER_MESSAGE_LISTENER_KEY = "client-listener";
const limit = 30;

var appID = "1424e7726e315b";
var apiKey = "8bc644764d77f50ef8661660302e0fd6623f4fb4";



const divStyle = {
  display: 'flex',
  alignItems: 'center'
};


export class guesscustomerquery extends Component {
  state = {
    authorFirstName: '',
    authorLastName: '',
    authorId: '',
    sel: '',
    title: '',
    content: '',
    email:'',
    emailError:true,
    emailNoError: false,
    image: '',
    imageURL: '',
    phone: '',
    phoneError:true,
    phoneNoError:false,
    caseId:0,
    toggle:false,
    solveStatus:'',
    deadline:'',
    addFormVisible: false,
    count: 1,
    countError: false,
    // time: 0,
    // timeError: false
  }

  sendCustomerConfirmationEmail = _ => {
      fetch(`http://localhost:4000/confirmation_email?recipient=${this.state.email}`).then(res=>console.log(res)).catch(err=>console.log(err));
      fetch(`http://localhost:4000/AdminConfirmation_email?sender=${this.state.email}`).then(res=>console.log(res)).catch(err=>console.log(err));
  }



  handleChange = (e) => {
    this.setState({
      [e.target.id]: e.target.value
    })
    if(e.target.id==='email'){
      this.validateEmail(e.target.value);
    }
    if(e.target.id==='phone'){
      this.validateNumber(e.target.value);
    }
  }

  handleClick = (e) =>{
    if(this.state.addFormVisible){
      this.setState({
        addFormVisible: false
      })
    }else{
      this.setState({
        addFormVisible: true
      })
    }
  }
  toggle = () => {
    let { toggle } = this.state
    this.setState({ toggle: !toggle })
  }
  handleSubmit = (e) => {
    var days=7; // Days you want to subtract
    var date = new Date();
    var last = new Date(date.getTime() + (days * 24 * 60 * 60 * 1000));
    e.preventDefault();
    //console.log(this.state)
      console.log("creating a new user.");
      this.createUser().then(
        result => {
          console.log('auth token fetched', result);
          localStorage.setItem("cc-uid",result.uid);
          var uid2 = localStorage.getItem("cc-uid");
          console.log("uid2 is ",uid2);

          this.setState({
            deadline:last,
            caseId: uid2,
            solveStatus: "processing"}, function () {
          console.log(this.state.caseId);
          this.props.createTicket(this.state);
          this.toggle();
      },
      error => {
        console.log('Creating user failed with error:', error);
      })
    });

    if (this.state.count>2){
      this.setState({
        countError: true
      })
    }
    if (this.state.count <=3) {
      this.setState({
        count: this.state.count+1
      })
    }


    // console.log(date.getMinutes());
    // if (this.state.time==0){
    //   this.setState({
    //     time: date.getMinutes()
    //   })
    // }
    // if (this.state.time !=0) {
    //   const elapse = !((date.getMinutes()-this.state.time)<1);
    //   if(elapse == true){
    //     this.setState({
    //       timeError: elapse,
    //       time: 0
    //     })
    //   }
    //   else{
    //     this.setState({
    //       timeError: elapse
    //     })
    //   }
    //
    // }
    // console.log("timeError: " + this.state.timeError);
    // console.log("time: " + this.state.time);
}

  renderChatBot = () => {
  const { addFormVisible } = this.state;
  if (addFormVisible) {
    return (
      <div id="todo-add-form" className="col s10 offset-s1">
      <iframe
        allow="microphone;"
        width="350"
        height="430"
        src="https://console.dialogflow.com/api-client/demo/embedded/dabf61c4-4db6-44b3-9459-5517e7ad154e">
      </iframe>
      </div>
    );
  }
};

componentDidMount() {
  addResponseMessage('Welcome to our platform!');
  addResponseMessage('How can we help you?');
  localStorage.clear();

  let uid = localStorage.getItem("cc-uid");
  console.log("Component did mount.");
  console.log("uid in componentDidMount is ",uid);
  // check for uid, if exist then get auth token, login, create message listener and fetch previous messages
 if ( uid !== null) {
   this.fetchAuthToken(uid).then(
     result => {
       console.log('auth token fetched', result);
       CometChat.login(result.authToken)
       .then( user => {
         console.log("Login successfully:", { user });
         this.createMessageListener();
         this.fetchPreviousMessages();

      })
     },
     error => {
       console.log('Initialization failed with error:', error);
     }
   );
 }
}

fetchAuthToken = async uid => {
  const response = await fetch(`/api/auth?uid=${uid}`)
  const result = await response.json()
  return result;
}

createUser = async () => {
  const response = await fetch(`/api/create?name=${this.state.authorFirstName}`)
  const result = await response.json()
  return result;
}

createMessageListener = () => {
  CometChat.addMessageListener(
    CUSTOMER_MESSAGE_LISTENER_KEY,
    new CometChat.MessageListener({
      onTextMessageReceived: message => {
        console.log("Incoming Message Log", { message });
        addResponseMessage(message.text);
      }
    })
  );
}

fetchPreviousMessages = () => {
  var messagesRequest = new CometChat.MessagesRequestBuilder()
  .setUID(agentUID)
  .setLimit(limit)
  .build();

  messagesRequest.fetchPrevious().then(
    messages => {
      console.log("Message list fetched:", messages);
      messages.forEach( message => {
        if(message.receiver !== agentUID){
          addResponseMessage(message.text);
        } else {
          addUserMessage(message.text)
        }
      });
    },
    error => {
      console.log("Message fetching failed with error:", error);
    }
  );
}

handleNewUserMessage = newMessage => {
  console.log(`New message incoming! ${newMessage}`);
  var textMessage = new CometChat.TextMessage(
    agentUID,
    newMessage,
    CometChat.MESSAGE_TYPE.TEXT,
    CometChat.RECEIVER_TYPE.USER
  );
  let uid = localStorage.getItem("cc-uid");
  console.log("uid in handleNewUserMessage is ",uid);

  if (uid === null) {
    console.log("creating a new user.");
    this.createUser().then(
      result => {
        console.log('auth token fetched', result);
        localStorage.setItem("cc-uid",result.uid)
        CometChat.login(result.authToken)
        .then(user => {
          console.log("Login successfully:", { user });
          CometChat.sendMessage(textMessage).then(
            message => {
              console.log('Message sent successfully:', message);
            },
            error => {
              console.log('Message sending failed with error:', error);
            }
          );
          CometChat.addMessageListener(
            CUSTOMER_MESSAGE_LISTENER_KEY,
            new CometChat.MessageListener({
              onTextMessageReceived: message => {
                console.log("Incoming Message Log", { message });
                addResponseMessage(message.text);
              }
            })
          );
        })
    },
    error => {
      console.log('Initialization failed with error:', error);
    })
  } else {
    // we have uid, do send
    CometChat.sendMessage(textMessage).then(
      message => {
        console.log('Message sent successfully:', message);
      },
      error => {
        console.log('Message sending failed with error:', error);
      }
    );
  }
};
handleChangeCaseID= (e) => {
  this.setState({
    caseId: e.target.value
  })
}
handleSubmitCaseID= (e) => {
  e.preventDefault();
  console.log(this.state.caseId)
  var caseId1 = this.state.caseId;
  this.props.history.push(`/customerdashboard`,{caseId:caseId1})
}

componentWillUnmount() {
  CometChat.removeMessageListener(CUSTOMER_MESSAGE_LISTENER_KEY);
  CometChat.logout();
  dropMessages();
}

handleUploadStart = () => this.setState({ isUploading: true, progress: 0 });
  handleProgress = progress => this.setState({ progress });
  handleUploadError = error => {
    this.setState({ isUploading: false });
    console.error(error);
  };
  handleUploadSuccess = filename => {
    this.setState({ image: filename, progress: 100, isUploading: false });
    firebase
      .storage()
      .ref("feedback")
      .child(filename)
      .getDownloadURL()
      .then(url => this.setState({ imageURL: url }));

  };

  validateEmail(email){
   const pattern = /[a-zA-Z0-9]+[\.]?([a-zA-Z0-9]+)?[\@][a-z]{3,9}[\.][a-z]{2,5}/g;
   const result = pattern.test(email);
   if(result===true){
     this.setState({
       emailError:false,
       emailNoError:false,
       email : email
     })
   }else{
     this.setState({
       emailError:true,
       emailNoError:true,
     })
   }
 }

 validateNumber(phone){
   // const pattern = /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/;
   // const pattern = /^\d{3}(\))?\d{3}\d{4}$/;
   const pattern = /^\d{8,10}$/;
   const result = pattern.test(phone);
   if(result===true){
     this.setState({
       phoneError:false,
       phoneNoError:false,
       phone: phone
     })
   }else{
     this.setState({
       phoneError:true,
       phoneNoError:true,
     })
   }
 }

  render() {
    const { authorFirstName, sel, title, content, email, phone } = this.state;
    const isEnabled =
      authorFirstName.length > 0 &&
      sel.length > 0 &&
      title.length > 0 &&
      content.length > 0 &&
      this.state.emailError == false &&
      this.state.phoneError == false &&
      this.state.countError == false ;
    // if (!auth.uid) return<Redirect to='/signin' />
    return (
      <div className="container">

      <form className="white formQuery" id="submit-case-id">
        <h5 className="text-white  purple darken-3">Status</h5>
      <div className="input-field">
        <label className="grey-text text-darken-3" htmlFor="intpuCaseId">Already have a case ID?</label>
        <input type="text" id="input-case-id" onChange={this.handleChangeCaseID}/>
      </div>
      <div>
        <button className="btn purple darken-3 text-white" id="submit-case-id-button" onClick={this.handleSubmitCaseID}>Check Progress</button>
      </div>

      </form>
      <div className="">
        <button id="chatbot" className="btn purple darken-3 text-white" id="open-chat-bot" onClick={this.handleClick}>Chat with AccenBot</button>
        {this.renderChatBot()}
      </div>
      <Drawer
        open={this.state.toggle}
        onRequestClose={this.toggle}
      >
        <h2 className="white-text">Your case ID is {this.state.caseId}. Please save it for future reference!</h2>
      </Drawer>

        <div >
                <form onSubmit={this.handleSubmit} className="white formQuery" id="createForm">
                  <h5 className="text-white  purple darken-3">Contact Us</h5>
                    <div className="input-field">
                      <label className="grey-text text-darken-3" htmlFor="authorFirstName">First Name</label>
                      <input type="text" id="authorFirstName" onChange={this.handleChange}/>
                    </div>
                    <div className="input-field">
                      <label className="grey-text text-darken-3" htmlFor="authorLastName">Last Name</label>
                      <input type="text" id="authorLastName" onChange={this.handleChange}/>
                    </div>
                    <div class="row">
                      <div class="input-field col s12">
                        <label className="grey-text text-darken-3" htmlFor="email">Email</label>
                        <input type="email" id="email" class="validate" onChange={this.handleChange}/>
                        {this.state.emailNoError ? <span style={{color: "red"}}>Please Enter valid email address</span> : ''}
                      </div>
                    </div>
                    <div className="input-field">
                      <label className="grey-text text-darken-3" htmlFor="phone">Phone Number</label>
                      <input type="text" id="phone" class="validate" onChange={this.handleChange}/>
                      {this.state.phoneNoError ? <span style={{color: "red"}}>Please Enter valid contact number</span> : ''}
                    </div>
                  <div>
                    <label className="grey-text text-darken-3" id= "category">Category:</label>
                    <select class="browser-default" id= "sel" onChange={this.handleChange}>
                      <option value="" disabled selected>Choose your category</option>
                      <option value="finance">Finance</option>
                      <option value="it">IT</option>
                      <option value="general">General</option>
                      <option value="recruitment">Recruitment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="input-field">
                    <label className="grey-text text-darken-3" htmlFor="title">Title</label>
                    <input type="text" id="title" onChange={this.handleChange}/>
                  </div>
                  <div className="input-field">
                    <label className="grey-text text-darken-3" htmlFor="content">Ticket Content</label>
                    <textarea id="content" className="materialize-textarea" onChange={this.handleChange}></textarea>
                  </div>
                  {this.state.isUploading && <p>Progress: {this.state.progress}</p>}
                  <label id="imageUpload" className="btn purple darken-3 text-white">
                    <i class="material-icons">add_a_photo</i>
                    Upload Image
                    <FileUploader
                      hidden
                      accept="image/*"
                      randomizeFilename
                      storageRef={firebase.storage().ref('feedback')}
                      onUploadStart={this.handleUploadStart}
                      onUploadError={this.handleUploadError}
                      onUploadSuccess={this.handleUploadSuccess}
                      onProgress={this.handleProgress}
                    />
                  </label>
                <div class="responsive-img offset-s6 " >
                  {this.state.imageURL && <img class="responsive-img" src={this.state.imageURL} />}
                </div>
                  <div className="input-field">
                    <button disabled={!isEnabled} id="create" className="btn purple darken-3 text-white"  onClick={this.sendCustomerConfirmationEmail}>Create</button>
                  </div>
                </form>

                <div>
                <Widget
                  handleNewUserMessage={this.handleNewUserMessage}
                  title='Accenture Support Live Chat'
                  subtitle='Ready to help you'
                />

                </div>
          </div>
      </div>
    )
  }
}

const mapStateToProps =(state) => {
  return {
    auth: state.firebase.auth,

  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    createTicket: (ticket) => dispatch(createTicket(ticket))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(guesscustomerquery);
