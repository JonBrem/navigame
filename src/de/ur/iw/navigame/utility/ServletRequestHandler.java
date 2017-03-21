package de.ur.iw.navigame.utility;


import javax.servlet.http.HttpServletResponse;
import java.util.Map;

public interface ServletRequestHandler {

    void handleRequest(Map<String, String[]> params, HttpServletResponse response);

}
