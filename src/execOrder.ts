"use strict"
import fetch from 'node-fetch';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

export const exeOrder = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

  const tradeInfo = JSON.parse(JSON.stringify(event.body))
  console.log(tradeInfo);
  
  let prevState: string, curState: string;

  if (tradeInfo.market_position == 'flat') {
    curState = '空手';
  } else if(tradeInfo.market_position == 'long') {
    curState = '做多';
  } else if(tradeInfo.market_position == 'short') {
    curState = '做空';
  } 

  if (tradeInfo.prev_market_position == 'flat') {
    prevState = '空手';
  } else if(tradeInfo.prev_market_position == 'long') {
    prevState = '做多';
  } else if(tradeInfo.prev_market_position == 'short') {
    prevState = '做空';
  }

  let response = await fetch(`https://api.bybit.com/derivatives/v3/public/tickers?category=linear&symbol=ETHUSDT`, {
    method: 'GET',
    headers: {
        "X-BAPI-RECV-WINDOW": `5000`,
        "Content-Type": 'application/json; charset=utf-8',
    }
  });

  let result = await response.json();
  console.log('result is: ', JSON.stringify(result, null, 4));
  console.log(result.result.list[0]);

  const msg = encodeURIComponent(`**指標名稱:** ${tradeInfo.strategy_name} \n\n**ETH:** ${prevState} 轉 ${curState} \n\n**當前 ETH 價格:** ${result.result.list[0].lastPrice}`);
  const reqURL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage?chat_id=${process.env.TELEGRAM_GROUPID}&text=${msg}`;

  response = await fetch(reqURL, {
    method: 'POST',
    headers: {
        "Accept": 'application/json',
    },
  });

  result = await response.json();
  console.log('result is: ', JSON.stringify(result, null, 4));

  // update function
  try {
    // return update successfully message
    return {
      statusCode: 200,
      body: JSON.stringify({
          message: "Token Object Update Successfully!",
      })
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: err.statusCode || 501,
      body: JSON.stringify(
        {
          message: "Error Occured when updating token data!",
          details: err,
        },
        null,
        2
      ),
    }
  }
}