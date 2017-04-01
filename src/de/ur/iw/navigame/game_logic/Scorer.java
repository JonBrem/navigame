package de.ur.iw.navigame.game_logic;

import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONObject;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

/*
 * This is a dummy implementation - it only checks if the end is on the correct map.
 */
/**
 * The Scorer takes the path data for a session and its start and goal and calculates a score for the path.
 * This score indicates how good the route that was entered is.
 */
public class Scorer implements ServletRequestHandler {

    @Override
    public void handleRequest(Map<String, String[]> params, HttpServletResponse response) {
        JSONObject obj = new JSONObject(params.get("path_data")[0]);

        try {
            writeResponse(response, obj);
        } catch (Exception e) {
            writeError(response, e);
        }
    }

    private void writeError(HttpServletResponse response, Exception e) {
        try {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "An error occurred while calculating the score");
        } catch (IOException e1) {
            e1.printStackTrace();
        }
        e.printStackTrace();
    }

    private void writeResponse(HttpServletResponse response, JSONObject pathData) throws IOException {
        PrintWriter responeWriter = response.getWriter();
        JSONObject responseObject = new JSONObject();

        if (lastNodeIsOnRightMap(pathData)) {
            responseObject.put("score", (int) (90 + Math.random() * 10));
        } else {
            responseObject.put("score", (int) (Math.random() * 45));
        }

        responeWriter.write(responseObject.toString());
    }

    private boolean lastNodeIsOnRightMap(JSONObject pathData) {
        return false;
    }
}
