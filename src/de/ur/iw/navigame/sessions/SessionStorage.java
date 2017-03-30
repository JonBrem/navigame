package de.ur.iw.navigame.sessions;

import de.ur.iw.navigame.utility.FileStorage;
import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONObject;

import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

public class SessionStorage implements ServletRequestHandler {

    @Override
    public void handleRequest(Map<String, String[]> params, HttpServletResponse response) {
        if (params.get("method")[0].equals("save_path")) {
            saveSession(params, response);
        } else if (params.get("method")[0].equals("load_path")) {
            loadSession(params, response);
        }
    }

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

    private void loadSession(Map<String, String[]> params, HttpServletResponse response) {
        String pathId = params.get("path_id")[0];

        if (FileStorage.fileExists("session" + pathId + ".txt")) {
            FileStorage.loadFile("session" + pathId + ".txt",
                    s -> {
                        printSession(s, response);
                    },
                    v -> {
                        try {
                            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    });
        } else {
            // @todo some error that the session could not be loaded!
        }
    }

    private  void printSession(String json, HttpServletResponse response) {
        try {
            PrintWriter writer = response.getWriter();

            writer.write(json);

            writer.flush();
            writer.close();
        } catch (Exception ignored) { }
    }
}
