import type Hapi from '@hapi/hapi';
import { StatusCodes } from 'http-status-codes';

const ocnResponse = `<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope" xmlns:iata="http://www.iata.org/IATA/2015/00/2018.2/IATA_Acknowledgement">
  <soap:Header/>
  <soap:Body>
    <iata:IATA_Ack>
      <iata:Notification>
        <iata:StatusCode>OK</iata:StatusCode>
        <iata:StatusMessageText>IATA_OrderChangeNotifRQ acknowledged</iata:StatusMessageText>
      </iata:Notification>
    </iata:IATA_Ack>
  </soap:Body>
</soap:Envelope>`;

async function ocnHandler(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<APIResponse> {
  console.log(request.raw.req.headers);

  return h.response(ocnResponse).type('text/xml').code(StatusCodes.OK);
}

const captchaPlugin = {
  name: 'app/captcha',
  dependencies: [],
  register: async (server: Hapi.Server) => {
    server.route([
      {
        method: 'POST',
        path: '/ocn',
        handler: ocnHandler,
      },
    ]);
  },
};

export default captchaPlugin;
