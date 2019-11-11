const shopAPI = 'https://demo7609961.mockable.io/orders/';
const dhlAPI = 'https://demo7609961.mockable.io/dhl/status/';

function getEnteredEmail() {
  let email;
  let emailInput = document.getElementById("client_email");
  if (emailInput.validity.valid) {
    email = emailInput.value;
    constructBotReply("Thank you! Checking...");
    disableEmailInput();
    return email
  }

  constructBotReply("The email address seems to be not correct. Please correct it.")
}

function disableEmailInput() {
  document.getElementById('email-btn').disabled = true;
  document.getElementById('client_email').disabled = true;

}

function enableEmailInput() {
  document.getElementById('email-btn').disabled = false;
  document.getElementById('client_email').disabled = false;

}


function getLatestOrder(array) {
  let arr = array.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  return arr[0]
}

function constructFullURL(email) {
  let url = new URL(shopAPI);
  let params = {customer_email: email};
  url.search = new URLSearchParams(params).toString();
  return url

}

async function getOrderInfo(email) {
  let full_url = constructFullURL(email);

  try {
    let response = await fetch(full_url);
    return await response.json();
  } catch (error) {
    // handle error
    console.error('Error:', error);
  }

}

async function getShippingInfo(order_id) {

  let data = {
    order_id: order_id
  };

  let fetchData = {
    method: 'POST',
    body: JSON.stringify(data),
  };

  try {
    let response = await fetch(dhlAPI, fetchData);
    return await response.text();
  } catch (error) {
    // handle error
    console.error('Error:', error);
  }

}

function prepareReply(order, shipped = false) {
  constructBotReply("Ok, " + order.clientName + ", this is what I've got for you.")
  constructBotReply("The status of your latest order " + order.order_id + " made on " + new Date(order.date).toDateString()
    + " with " + order.items.length + " items " + " is: " + order.status.toUpperCase())
  if (shipped) {
    constructBotReply("Your order is " + order.shipmentStatus + " at " + order.extra + " on " + new Date(order.lastUpdate).toDateString())
  }

  constructBotReply("You can refer to carrier for more detailed information. Your DHL tracking number is: " + order.dhl_tracking_id)

}

function constructBotReply(text) {
  let el = document.createElement('DIV');
  el.classList.add('callout', 'primary');
  el.innerText = text;
  document.getElementById('chat-box').appendChild(el)


  let div = document.getElementById("chat-box");
  $('#' + "chat-box").animate({
    scrollTop: div.scrollHeight - div.clientHeight
  }, 500);

}


function handleOrderInformation() {
  let email = getEnteredEmail();
  if (email) {
    getOrderInfo(email)
      .then(function (data) {
        let orders = data.orders;
        if (orders.length > 0) {
          let latestOrder = getLatestOrder(orders);
          latestOrder.clientName = data.customer.firstname + ' ' + data.customer.lastname
          if (latestOrder.status === 'shipped') {
            getShippingInfo(latestOrder.order_id)
              .then(data => (new window.DOMParser()).parseFromString(data, "text/xml"))
              .then(function (data) {
                latestOrder.extra = data.getElementsByTagName('extraInfo')[0].childNodes[0].nodeValue;
                latestOrder.shipmentStatus = data.getElementsByTagName('status')[0].childNodes[0].nodeValue;
                latestOrder.lastUpdate = data.getElementsByTagName('lastUpdate')[0].childNodes[0].nodeValue;
                latestOrder.shipmentDate = data.getElementsByTagName('shipmentDate')[0].childNodes[0].nodeValue;
                prepareReply(latestOrder, shipped = true)
              });
          } else {
            //handle just order info
            prepareReply(latestOrder)
          }
        } else {
          constructBotReply("Sorry, I could not find any orders with this email address. Please double-check your email.")
          enableEmailInput()

        }
      });
  }

}


