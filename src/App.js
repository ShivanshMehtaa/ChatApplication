import { Container, Box, VStack, Button, Input, HStack} from "@chakra-ui/react"
import Message from "./components/Message";
import {onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut} from "firebase/auth"
import {app} from "./firebase"
import { useState,useEffect, useRef } from "react";
import {getFirestore,addDoc, collection, serverTimestamp,onSnapshot,query,orderBy } from "firebase/firestore"

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler =()=>{
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth,provider )
}

const logoutHandler =()=>{
  signOut(auth)
}


function App() {

  const [user, setUser] = useState(false);
  const [message,setMessage] = useState("")
  const [messages,setMessages] = useState([]);

  const divforScroll = useRef(null)

  const submitHandler = async (e)=>{
    e.preventDefault();
  
    try {
  
      await addDoc(collection(db,"Messages"),{
        text:message,
        uid:user.uid,
        uri:user.photoURL,
        createdAT:serverTimestamp(),
      });   

      setMessage("");
      divforScroll.current.scrollIntoView({scrollbehaviour:"smooth"})
    } catch (error) {
      alert(error);
    }
  };
  

  useEffect(() => {
    const q = query(collection(db,"Messages"),orderBy("createdAT","asc"))

    const logt = onAuthStateChanged(auth,(data)=>{
      // console.log(data)
      setUser(data)
    });

    const unsubscribeForMessages =  onSnapshot(q,(snap)=>{
      setMessages(snap.docs.map(item=>{
        const id = item.id;
        return {id,...item.data()};
      }))
    })

    return()=>{
      logt();
      unsubscribeForMessages();
    }
  }, [ ]);

  return (
    <Box bg={'red.100'}>
      {
        user?(
          <Container h={'100vh'} w={['96', 'full']} bg={"white"}>
        <VStack h={'full'} paddingY={'4'} >
          <Button w={'full'} onClick={logoutHandler} colorScheme={'red'}>
            LOGOUT
          </Button>

          <VStack h={'full'} w={'full'} overflowY={'auto'} css={{"&::-webkit-scrollbar":{
            display:"none"
          }}}> 
            {
              messages.map((item)=>(
                <Message key={item.id} user={item.uid===user.uid?"me":"other"}  text={item.text} uri={item.uri}/>
              ))
            }
            <div ref={divforScroll}></div>
          </VStack>
          

            <form style={{width:'100%'}} onSubmit={submitHandler}>
              <HStack>
              <Input 
              value={message}
              onChange={(e)=>{
                setMessage(e.target.value)
              }}
              placeholder={'Type a Message'}/>
              <Button colorScheme={'whatsapp'} type={'submit'}>SEND</Button>
              </HStack>
            </form>
        </VStack>
      </Container>
        ):
        <VStack justifyContent={"center"} h={"100vh"}>
          <Button onClick={loginHandler} colorScheme={"whatsapp"}>Sign In with Google</Button>
        </VStack>
      }
    </Box>
  );
}

export default App;
