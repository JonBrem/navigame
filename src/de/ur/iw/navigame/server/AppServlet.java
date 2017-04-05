package de.ur.iw.navigame.server;

import de.ur.iw.navigame.data_download.AreaLevels;
import de.ur.iw.navigame.data_download.UniversityAreas;
import de.ur.iw.navigame.game_logic.Scorer;
import de.ur.iw.navigame.sessions.SessionCreation;
import de.ur.iw.navigame.sessions.SessionStorage;
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
 * The AppServlet is the servlet class for this application and receives all API calls,
 * which it distinguishes by the "method"-Parameter they must provide.
 */
@WebServlet(name = "AppServlet")
public class AppServlet extends UnifiedServlet implements ServletContextListener {

    /** see {@link AppServlet#contextInitialized(ServletContextEvent)} for details */
    private static Map<String, ServletRequestHandler> requestHandlers;

    /**
     * Handles both GET and POST request (you could still make a distinction via request.getMethod()),
     * via the {@link UnifiedServlet}
     *
     * Any request must have a ?method=ABC parameter.
     * If the key ABC exists in requestHandlers, that handler will take care of the request.
     */
    @Override
    protected void handleRequest(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");

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

    /**
     * Builds a message that tells the user which request handlers are available.
     * @return a string containing a list of method-ids for which request handlers are registered to this servlet.
     */
    private String buildErrorMessage() {
        StringBuilder errorMessageBuilder = new StringBuilder("need key 'method' to be set to one of: ");
        for(String s : requestHandlers.keySet()) {
            errorMessageBuilder.append(s).append(", ");
        }

        return errorMessageBuilder.toString();
    }

    /**
     * Automatically called when the Server is started.
     * Request Handlers are registered here:
     *
     * API requests all come to the same URL and reach the {@link AppServlet}, but that only distributes it to the
     * appropriate {@link ServletRequestHandler} that is responsible for the request.
     * If a request looks like .../_api_url_?method=areas, then the request handler which is registered to the
     * "areas"-Key will take care of it.
     */
    @Override
    public void contextInitialized(ServletContextEvent servletContextEvent) {
        FileStorage.setServletContext(servletContextEvent.getServletContext());

        requestHandlers = new HashMap<>();
        requestHandlers.put("areas", new UniversityAreas());
        requestHandlers.put("area_levels", new AreaLevels());
        requestHandlers.put("request_id", new SessionCreation());

        requestHandlers.put("save_path", new SessionStorage());
        requestHandlers.put("load_path", new SessionStorage());

        requestHandlers.put("submit_path", new Scorer());
    }

    /**
     * Automatically called when the Server is shut down.
     */
    @Override
    public void contextDestroyed(ServletContextEvent servletContextEvent) {
    }
}
