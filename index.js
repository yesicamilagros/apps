



const express = require("express");
const OpenAI= require('openai');
const body_parser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const usuariosActivos = {}; // Ej: { '5219999999999': timeoutID }





const app = express().use(body_parser.json());

const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;

////////////////////
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  //////////




app.listen(process.env.PORT, () => {
    console.log("webhook is listening");
});

app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let challenge = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];

    if (mode && token) {
        if (mode === "subscribe" && token === mytoken) {
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

app.post("/webhook", async (req, res) => {
    try {
        const body = req.body;
        console.log("Webhook recibido:\n", JSON.stringify(body, null, 2));

        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
            const from = message.from;
            if (usuariosActivos[from]) {
                                        clearTimeout(usuariosActivos[from]);
                                        delete usuariosActivos[from];
                                    }



            
            const phone_number_id = value.metadata.phone_number_id;

            // Si es un mensaje de tipo texto
            const textBody = message?.text?.body;

            // Si es una respuesta de botón
            const buttonReplyID = message?.interactive?.button_reply?.id;







    

            if (buttonReplyID) {
                switch (buttonReplyID) {
                    case "btn_opcion_1":
                        await sendTextMessage(from, phone_number_id, "Perfecto, vamos a agendar tu cita.");
                         await sendAppointmentOptions(from, phone_number_id);
                        
  
                        break;
                    case "btn_opcion_2":
                       
                        await sendasesor(from, phone_number_id);
                        break;
                    case "btn_opcion_3":
                        await sendTextMessage(from, phone_number_id, "Aquí puedes ver nuestros servicios: depilzone.com/servicios");
                        break;

                    case "dia_lunes":
                    case "dia_martes":
                    case "dia_miercoles":
                   
                    await sendTextMessage(from, phone_number_id, "Excelente, selecciona un horario disponible:");
                   await sendTimeOptions(from, phone_number_id);
                        
                        break;

                    case "hora_10am":
                    case "hora_12pm":
                    case "hora_4pm":
                        await sendTextMessage(from, phone_number_id, `Tu cita ha sido registrada para las ${buttonReplyID.split('_')[1].toUpperCase().replace('AM', ' AM').replace('PM', ' PM')}. ¡Gracias!`);
                        break;

                    case "ases_mensaje":
                        await sendTextMessage(from, phone_number_id, "Puedes contactarnos por WhatsApp en este enlace: https://wa.me/1234567890");
                        break;
                    
                    case "ases_llamada":
                        await sendTextMessage(from, phone_number_id, "Llámanos al +913850688");
                        break;


                    
                    default:
                        await sendTextMessage(from, phone_number_id, "Opción no reconocida.");

                  await  iniciarTemporizadorInactividad(from, phone_number_id);
                }
            } else {
                // Si no es botón, mandamos el mensaje con los botones

         //if (){
             
           //  const aiResponse = await reply(textBody);
           //  await sendTextMessage(from, phone_number_id, aiResponse);  
        // }
             

               await sendInteractiveMessage(from, phone_number_id);
                iniciarTemporizadorInactividad(from, phone_number_id); 
             


            }

            return res.sendStatus(200);
        } else {
            return res.sendStatus(404);
        }
    } catch (err) {
        console.error("Error en el webhook:", err.message);
        return res.sendStatus(500);
    }
});

async function sendTextMessage(to, phone_number_id, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`,
            {
                messaging_product: "whatsapp",
                to,
                text: { body: text }
            },
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Error enviando mensaje:", err.response?.data || err.message);
    }
}

async function sendInteractiveMessage(to, phone_number_id) {
    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`,
            {
                messaging_product: "whatsapp",
                to,
                type: "interactive",
                interactive: {
                    type: "button",
                    header: {
                        type: "image",
                        image: {
                            link: "https://i.ibb.co/HDPPFMVs/images-1.png"
                        }
                    },
                    body: {
                        text: "Bienvenido(a) a Depilzone, ¿En qué podemos ayudarte?"
                    },
                    footer: {
                        text: "Soporte automático"
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: "btn_opcion_1",
                                    title: "Agendar una cita"
                                }
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "btn_opcion_2",
                                    title: "Hablar con un asesor"
                                }
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "btn_opcion_3",
                                    title: "Ver servicios"
                                }
                            }
                        ]
                    }
                }
            },
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Error enviando mensaje interactivo:", err.response?.data || err.message);
    }
}



async function sendAppointmentOptions(to, phone_number_id) {
    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`,
            {
                messaging_product: "whatsapp",
                to,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: "¿Qué día te gustaría agendar tu cita?"
                    },
                    footer: {
                        text: "Selecciona una opción por favor"
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: "dia_lunes",
                                    title: "Lunes"
                                }
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "dia_martes",
                                    title: "Martes"
                                }
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "dia_miercoles",
                                    title: "Miércoles"
                                }
                            }
                        ]
                    }
                }
            },
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Error enviando opciones de cita:", err.response?.data || err.message);
    }
}



async function sendTimeOptions(to, phone_number_id) {
    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`,
            {
                messaging_product: "whatsapp",
                to,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: "¿A qué hora te gustaría agendar tu cita?"
                    },
                    footer: {
                        text: "Selecciona un horario por favor"
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: "hora_10am",
                                    title: "10:00 AM"
                                }
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "hora_12pm",
                                    title: "12:00 PM"
                                }
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "hora_4pm",
                                    title: "4:00 PM"
                                }
                            }
                        ]
                    }
                }
            },
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Error enviando opciones de horario:", err.response?.data || err.message);
    }
}


async function sendasesor(to, phone_number_id) {
    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/${phone_number_id}/messages?access_token=${token}`,
            {
                messaging_product: "whatsapp",
                to,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: "tenemos asesores a tu disposicion"
                    },
                    footer: {
                        text: "Selecciona como deseas que se comuniquen contigo"
                    },
                    action: {
                        buttons: [
                            {
                            type: "reply",
                            reply: {
                              id: "ases_mensaje",
                              title: "WhatsApp"
                            }
                          },
                          {
                            type: "reply",
                            reply: {
                              id: "ases_llamada",
                              title: "Llamada"
                            }
                          }
                        ]
                    }
                }
            },
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Error enviando opciones de asesor:", err.response?.data || err.message);
    }
}







async function iniciarTemporizadorInactividad(usuario, phone_number_id) {

     try {
    // Limpiar temporizadores anteriores si existen
    if (usuariosActivos[usuario]) {
        clearTimeout(usuariosActivos[usuario]);
    }

    // Crear nuevo timeout de 5 minutos
    const timeoutID = setTimeout(async () => {
    try {
        await sendTextMessage(usuario, phone_number_id, "¿Sigues ahí? Si necesitas ayuda, estoy disponible para ayudarte 💬.");
    } catch (err) {
        console.error("Error enviando mensaje de inactividad:", err.message);
    }
    delete usuariosActivos[usuario];
}, 2 * 60 * 1000);  // 5 minutos en ms

    // Guardarlo en el mapa
    usuariosActivos[usuario] = timeoutID;
}  catch (err) {
        console.error("Error en el temporizador de inactividad:", err.message);
    }
}



















const chatMessages = [
    {
      role: 'system',
      content: 'reply to the messages you get in 100 characters',
    },
  ];
  
  async function reply(msg) {
    chatMessages.push({
      role: 'user',
      content: `Si aquí: ${msg} te preguntan quién eres o qué haces, podrías decirle que eres un chatbot de Depilzone, que estás disponible para cualquier duda. Depilzone es una clínica de cuidado de piel.`,

    });
    const response = await openai.chat.completions.create({
      messages: chatMessages,
      model: 'gpt-4o-mini',
      max_tokens: 300,
      temperature: 0.5,
      frequency_penalty: 0.5,
    });
    return response.choices[0].message.content;
  }
