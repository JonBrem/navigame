package de.ur.iw.navigame.server;

import de.ur.iw.navigame.data_download.UniversityAreas;
import de.ur.iw.navigame.utility.FileStorage;
import de.ur.iw.navigame.utility.ServletRequestHandler;
import de.ur.iw.navigame.utility.UnifiedServlet;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 *
 */
@WebServlet(name = "AppServlet")
public class AppServlet extends UnifiedServlet implements ServletContextListener {

    private static Map<String, ServletRequestHandler> requestHandlers;

    /**
     * Handles both GET and POST request (you could still make a distinction via request.getMethod())
     *
     * Any request must have a ?method=ABC parameter.
     * If the key ABC exists in requestHandlers, that handler will take care of the request.
     */
    @Override
    protected void handleRequest(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        Map<String, String[]> params = request.getParameterMap();

        if (params.containsKey("method")) {
            if (requestHandlers != null && requestHandlers.containsKey(params.get("method")[0])) {
                requestHandlers.get(params.get("method")[0]).handleRequest(params, response);
            } else {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, buildErrorMessage());
            }
        } else {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, buildErrorMessage());
        }
    }

    private String buildErrorMessage() {
        StringBuilder errorMessageBuilder = new StringBuilder("need key 'method' to be set to one of: ");
        for(String s : requestHandlers.keySet()) {
            errorMessageBuilder.append(s).append(", ");
        }

        return errorMessageBuilder.toString();
    }

    /**
     * Automatically called when the Server is started.
     * Request Handlers are registered here!
     */
    @Override
    public void contextInitialized(ServletContextEvent servletContextEvent) {
        FileStorage.setServletContext(servletContextEvent.getServletContext());

        requestHandlers = new HashMap<>();
        requestHandlers.put("areas", new UniversityAreas());
        requestHandlers.put("detail", new UniversityAreas());
    }

    /**
     * Automatically called when the Server is shut down
     */
    @Override
    public void contextDestroyed(ServletContextEvent servletContextEvent) {
    }
}
