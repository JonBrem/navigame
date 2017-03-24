package de.ur.iw.navigame.sessions;

import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONObject;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;
import java.util.UUID;

public class SessionIDs implements ServletRequestHandler {

    @Override
    public void handleRequest(Map<String, String[]> params, HttpServletResponse response) {
        try {
            PrintWriter writer = response.getWriter();

            JSONObject obj = new JSONObject();
            obj.put("session_id", UUID.randomUUID().toString());

            writer.write(obj.toString());

            writer.flush();
            writer.close();
        } catch (Exception e) {
            try {
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getLocalizedMessage());
            } catch (IOException e1) {
                e1.printStackTrace();
            }
        }
    }
}
