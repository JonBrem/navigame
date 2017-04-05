package de.ur.iw.navigame.game_logic;

import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONObject;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

/*
 * This is a dummy implementation - it will always return a random score.
 */
/**
 * The Scorer takes the path data for a session and its start and goal and calculates a score for the path.
 * This score indicates how good the route that was entered is.
 */
public class Scorer implements ServletRequestHandler {

    /**
     * Calculates a score based on how good the path is.
     *
     * @param params object containing the path data to evaluate.
     * @param response response that will receive the output / feedback.
     */
    @Override
    public void handleRequest(Map<String, String[]> params, HttpServletResponse response) {
        // JSONObject obj = new JSONObject(params.get("path_data")[0]); // <- this needs to be evaluated!

        try {
            writeResponse(response);
        } catch (Exception e) {
            writeError(response);
            e.printStackTrace();
        }
    }

    /**
     * Sends an internal server error to the client.
     *
     * @param response response that will receive the output / feedback.
     */
    private void writeError(HttpServletResponse response) {
        try {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "An error occurred while calculating the score");
        } catch (IOException e1) {
            e1.printStackTrace();
        }
    }

    /**
     * Prints the score to the client.
     *
     * @param response response that will receive the output / feedback.
     */
    private void writeResponse(HttpServletResponse response) throws IOException {
        PrintWriter responeWriter = response.getWriter();
        JSONObject responseObject = new JSONObject();

        responseObject.put("score", (int) (Math.random() * 100));


        responeWriter.write(responseObject.toString());
    }

}
