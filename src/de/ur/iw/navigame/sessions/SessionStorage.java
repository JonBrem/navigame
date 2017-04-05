package de.ur.iw.navigame.sessions;

import de.ur.iw.navigame.utility.FileStorage;
import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONObject;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

/**
 * The SessionStorage can save and load sessions.
 */
public class SessionStorage implements ServletRequestHandler {

    /**
     * Based on the exact method, this stores a session or loads a session from the file system.
     *
     * @param params request parameters. This distinguishes between "save_path" and "load_path" methods.
     * @param response response that will receive the output / feedback.
     */
    @Override
    public void handleRequest(Map<String, String[]> params, HttpServletResponse response) {
        if (params.get("method")[0].equals("save_path")) {
            saveSession(params, response);
        } else if (params.get("method")[0].equals("load_path")) {
            loadSession(params, response);
        }
    }

    /**
     * Saves a session on the file system.
     *
     * @param params needs to contain a String at the "path_data"-key of the params for this to work.
     * @param response response that will receive the output / feedback.
     */
    private void saveSession(Map<String, String[]> params, HttpServletResponse response) {
        JSONObject obj = new JSONObject(params.get("path_data")[0]);
        String pathId = obj.getString("pathId");

        FileStorage.storeFile("session" + pathId + ".txt", params.get("path_data")[0]);

        try {
            PrintWriter writer = response.getWriter();

            JSONObject responseObj = new JSONObject();
            responseObj.put("status", "ok");
            writer.write(responseObj.toString());

            writer.flush();
            writer.close();
        } catch (Exception ignored) { }
    }

    /**
     * Tries to load the session for which a key is provided at the "path_id"-key in the params.
     * Sends an error message if that failed.
     *
     * @param params must contain a "path_id" key, which is the {@link java.util.UUID} of the session.
     * @param response response that will receive the output / feedback.
     */
    private void loadSession(Map<String, String[]> params, HttpServletResponse response) {
        String pathId = params.get("path_id")[0];

        if (FileStorage.fileExists("session" + pathId + ".txt")) {
            FileStorage.loadFile("session" + pathId + ".txt",
                    s -> printSession(s, response),
                    v -> {
                        try {
                            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    });
        } else {
            sendSessionNotFoundError(response);
        }
    }

    /**
     * Sends a {status: "session_404"} response to the client.
     *
     * @param response response that will receive the output / feedback.
     */
    private void sendSessionNotFoundError(HttpServletResponse response) {
        try {
            JSONObject sessionNotFoundResponse = new JSONObject();
            sessionNotFoundResponse.put("status", "session_404");
            response.getWriter().write(sessionNotFoundResponse.toString());
            response.getWriter().flush();
            response.getWriter().close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Prints "json" to the PrintWriter of the response.
     * @param json contents of the session file
     * @param response response that will receive the output / feedback.
     */
    private void printSession(String json, HttpServletResponse response) {
        try {
            PrintWriter writer = response.getWriter();

            writer.write(json);

            writer.flush();
            writer.close();
        } catch (Exception ignored) { }
    }
}
